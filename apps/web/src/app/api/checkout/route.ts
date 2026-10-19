import { NextRequest, NextResponse } from 'next/server'
import { createOrder, createServerClient, resolveActivePayment, gatewayFromInstance, getStockForVariants, TuCompraGateway, ensureCustomer, listActivePromotions, computePromotions, getGiftCardByCode, redeemGiftCard, getStoreCreditBalance, addStoreCredit, computeRedemption, applyStockForOrder, getBundlesByIds, expandBundleLines, getCouponByCode, validateCoupon } from '@merkiai/database'
import { stackServerApp } from '@/stack'
import { baseUrlFromRequest } from '@/lib/base-url'
import { resolveTenant } from '@/lib/tenant-context';
import { getMachineDb } from '@/lib/machine-db'
import { findLockedVariants, computeVipMemberDiscount } from '@/lib/vip-access'

// ── Rate limiting (best-effort, per-instance) ──────────────────────────────────
// Allows MAX_REQUESTS per IP within WINDOW_MS. In Vercel's serverless model
// each function instance maintains its own in-memory store; this provides
// basic DoS protection. For production-grade limiting use @upstash/ratelimit.
const WINDOW_MS      = 60_000  // 1 minute
const MAX_REQUESTS   = 10      // max checkout attempts per IP per window

type RateLimitEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_REQUESTS
}

/**
 * Auto-guarda la dirección de envío en customer_addresses para el usuario logueado.
 * Se llama silenciosamente después de crear la orden — nunca bloquea el checkout.
 */
async function saveAddressForUser(
  stackUserId: string,
  userEmail: string,
  shipping: { name: string; phone: string | null; address: string; city: string; department: string | null; postal_code: string | null },
  tenantId?: string,
) {
  try {
    const supabase = createServerClient()

    // Buscar el customer
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('stack_id', stackUserId)
      .maybeSingle()

    if (!customer) {
      const { data: byEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle()
      customer = byEmail
    }

    if (!customer?.id) return

    // Verificar si ya existe una dirección igual para no duplicar
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('address', shipping.address)
      .eq('city', shipping.city)
      .maybeSingle()

    if (existing) return // Ya guardada, no duplicar

    // Si no tiene dirección default, esta será la default
    const { data: hasDefault } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('is_default', true)
      .maybeSingle()

    const isDefault = !hasDefault

    await supabase.from('customer_addresses').insert({
      customer_id: customer.id,
      full_name: shipping.name,
      phone: shipping.phone,
      address: shipping.address,
      city: shipping.city,
      department: shipping.department,
      postal_code: shipping.postal_code,
      is_default: isDefault,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    })
  } catch {
    // Non-critical — never block the checkout
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Window': String(WINDOW_MS / 1000),
        },
      },
    )
  }

  try {
    const body = await req.json()

    const {
      email,
      name,
      phone,
      address,
      items,
      subtotal,
      shipping_cost,
      total,
      // payment_method del cliente se ignora a propósito: la pasarela se deriva
      // del servidor (active_provider) por seguridad.
      discount,
      coupon_code,
      shipping_rate,
      // Datos del medio de pago Tu Compra (modalidad integrador, elegidos en el checkout)
      tucompra,
      // HU-148 · pago con gift card / saldo a favor
      gift_card_code,
      use_store_credit,
    } = body

    // Extract carrier info from the rate the user selected
    const skydropx_rate_id: string | null = shipping_rate?.id ?? null
    const carrier_name: string | null = shipping_rate?.carrier_name ?? null

    if (!email || !name || !address || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Tenant del pedido (resolución por host; siempre un tenantId). Necesario
    // antes del stock para expandir bundles por tenant (server-authoritative).
    const { tenantId } = await resolveTenant()

    // ── HU-168 Fase 2 · expandir líneas de BUNDLE a sus componentes. Guarded:
    // si no hay líneas de bundle, `orderItems` es la lista normal sin cambios.
    // Los componentes y el precio se leen de la BD (no se confía en el cliente).
    const rawItems = items as Array<{ variant_id?: number; qty: number; product_name?: string; variant_label?: string; price?: number; bundle_id?: number }>
    const bundleIds = [...new Set(rawItems.filter((i) => i.bundle_id).map((i) => i.bundle_id as number))]
    const mdbPricing = getMachineDb(tenantId)
    const bundleMap = new Map<number, { name: string; price: number; components: Array<{ variant_id: number; qty: number }> }>()
    let orderItems: Array<{ variant_id: number; qty: number; product_name: string; variant_label: string; price: number }>
    if (bundleIds.length) {
      const bundleList = await getBundlesByIds(bundleIds, mdbPricing)
      for (const b of bundleList) bundleMap.set(b.id, { name: b.name, price: b.price, components: b.components })
      const compVariantIds = bundleList.flatMap((b) => b.components.map((c) => c.variant_id))
      const { data: compRows } = await mdbPricing.from('product_variants').select('id, price').in('id', compVariantIds.length ? compVariantIds : [0])
      const compPrice = new Map((compRows ?? []).map((r: any) => [r.id as number, Number(r.price)]))
      orderItems = expandBundleLines(rawItems, bundleMap, compPrice)
    } else {
      orderItems = rawItems
        .filter((i) => i.variant_id)
        .map((i) => ({ variant_id: i.variant_id as number, qty: i.qty, product_name: i.product_name ?? '', variant_label: i.variant_label ?? '', price: i.price ?? 0 }))
    }

    // ── HU-297 · PRICING AUTORITATIVO: el subtotal se recomputa desde los precios
    // ACTUALES de la BD (variantes para líneas normales, precio del bundle para
    // kits). Se ignora el `price`/`subtotal` que envía el cliente. Para pedidos
    // normales coincide con el del cliente; si un precio cambió, manda el servidor.
    const normalVariantIds = rawItems.filter((i) => !i.bundle_id && i.variant_id).map((i) => i.variant_id as number)
    const { data: priceRows } = normalVariantIds.length
      ? await mdbPricing.from('product_variants').select('id, price').in('id', normalVariantIds)
      : { data: [] as Array<{ id: number; price: number }> }
    const dbPrice = new Map((priceRows ?? []).map((r: any) => [r.id as number, Number(r.price)]))
    let serverSubtotal = 0
    for (const it of rawItems) {
      const qty = Math.max(1, Math.floor(it.qty))
      if (it.bundle_id && bundleMap.has(it.bundle_id)) serverSubtotal += bundleMap.get(it.bundle_id)!.price * qty
      else if (it.variant_id) serverSubtotal += (dbPrice.get(it.variant_id) ?? 0) * qty
    }

    // ── Validación de stock (Épica 9) sobre los ítems ya expandidos: rechazar si
    // falta stock y el producto no permite backorder. El servidor es la autoridad.
    const stockRows = await getStockForVariants(
      orderItems.map((i) => i.variant_id).filter((v): v is number => !!v),
    )
    const stockMap = new Map(stockRows.map((r) => [r.variant_id, r]))
    const insufficient = orderItems.filter((i) => {
      const s = stockMap.get(i.variant_id)
      if (!s) return false // variante no encontrada → no bloqueamos (defensivo)
      return !s.allow_backorder && s.stock < i.qty
    })
    if (insufficient.length) {
      return NextResponse.json(
        {
          error: 'Stock insuficiente para uno o más productos',
          items: insufficient.map((i) => ({
            variant_id: i.variant_id,
            product_name: i.product_name,
            available: stockMap.get(i.variant_id)?.stock ?? 0,
          })),
        },
        { status: 409 },
      )
    }

    // ── Gating VIP (HU-290 AC-4): revalidar acceso anticipado en el servidor.
    // Si algún ítem está bloqueado para este visitante (campaña VIP viva y no es
    // miembro del segmento), se rechaza el checkout — no se puede saltar por API.
    const lockedVariants = await findLockedVariants(
      tenantId,
      orderItems.map((i) => i.variant_id).filter((v): v is number => !!v),
    ).catch(() => [])
    if (lockedVariants.length) {
      return NextResponse.json(
        { error: 'Uno o más productos son de acceso anticipado VIP y aún no están disponibles para tu cuenta.', vip_locked: lockedVariants },
        { status: 403 },
      )
    }

    // ── HU-147: motor de promociones (autoridad del total en el servidor, AC-4).
    // Solo se activa si la tienda tiene promociones activas; si no, el flujo es
    // idéntico al anterior (promoDiscount=0). El descuento se calcula desde los
    // precios ACTUALES del servidor, no desde lo que envía el cliente.
    let promoDiscount = 0
    const promoApplied: Array<{ promotion_id: number; name: string; amount: number }> = []
    try {
      const mdb = getMachineDb(tenantId)
      const activePromos = await listActivePromotions(mdb)
      if (activePromos.length > 0) {
        const vids = orderItems.map((i) => i.variant_id).filter((v): v is number => !!v)
        const { data: vrows } = await mdb
          .from('product_variants')
          .select('id, price, product_id, products!inner(category_id)')
          .in('id', vids)
        const priceMap = new Map<number, { price: number; product_id: number; category_id: number | null }>()
        for (const v of (vrows ?? []) as any[]) {
          const prod = Array.isArray(v.products) ? v.products[0] : v.products
          priceMap.set(v.id, { price: Number(v.price), product_id: v.product_id, category_id: prod?.category_id ?? null })
        }
        const cartLines = orderItems
          .map((i) => {
            const m = priceMap.get(i.variant_id)
            return m ? { variant_id: i.variant_id, product_id: m.product_id, category_id: m.category_id, qty: i.qty, price: m.price } : null
          })
          .filter((l): l is NonNullable<typeof l> => l !== null)
        const result = computePromotions(cartLines, activePromos)
        promoDiscount = result.discount
        promoApplied.push(...result.applied)
      }
    } catch {
      promoDiscount = 0 // fail-open: una promo mal configurada no debe tumbar el checkout
    }

    // HU-293 · precio de campaña VIP: descuento server-side para el miembro
    // elegible dentro de la ventana (sin fuga para no-elegibles). Fail-open.
    let vipDiscount = 0
    try {
      vipDiscount = await computeVipMemberDiscount(
        tenantId,
        orderItems.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
      )
    } catch {
      vipDiscount = 0
    }

    // ── HU-297 · cupón recomputado server-side desde `coupon_code` + el subtotal
    // AUTORITATIVO (no se confía en el `discount` del cliente). Inválido → 0.
    let serverCouponDiscount = 0
    if (coupon_code) {
      try {
        const coupon = await getCouponByCode(String(coupon_code).trim(), mdbPricing)
        if (coupon) {
          const r = validateCoupon(coupon, serverSubtotal)
          if (r.valid) serverCouponDiscount = r.discount
        }
      } catch { serverCouponDiscount = 0 }
    }

    // ── HU-297 · total DERIVADO del servidor: subtotal(BD) + envío − cupón − promo
    // − VIP. El crédito (gift card/saldo) se resta después. El cliente no decide
    // el total; `discount`/`total`/`subtotal` recibidos se ignoran.
    const extraDiscount = promoDiscount + vipDiscount
    const effectiveDiscount = serverCouponDiscount + extraDiscount
    let effectiveTotal = Math.max(0, serverSubtotal + Number(shipping_cost ?? 0) - serverCouponDiscount - extraDiscount)

    // ── HU-148 Fase 2 · canje de gift card / saldo a favor (guarded). Valida y
    // aplica server-side sobre el monto ya descontado. Decremento ATÓMICO de la
    // gift card + asiento en el ledger de saldo. Reduce el monto a cobrar a la
    // pasarela. Solo actúa si el cliente envió un código o pidió usar su saldo.
    let giftCardCodeApplied: string | null = null
    let giftCardAmount = 0
    let storeCreditAmount = 0
    let creditCustomerId: string | null = null
    if (gift_card_code || use_store_credit) {
      try {
        const mdb = getMachineDb(tenantId)
        // Saldo disponible de gift card (si se envió un código válido).
        let giftCardId: number | null = null
        let giftCardBalance = 0
        if (gift_card_code) {
          const gc = await getGiftCardByCode(String(gift_card_code), mdb)
          if (gc && gc.active && gc.balance > 0 && (!gc.expires_at || Date.now() < new Date(gc.expires_at).getTime())) {
            giftCardId = gc.id; giftCardBalance = gc.balance; giftCardCodeApplied = gc.code
          }
        }
        // Saldo a favor del cliente autenticado.
        let storeCredit = 0
        if (use_store_credit) {
          const su = await stackServerApp.getUser().catch(() => null)
          if (su?.id) {
            const { data: cust } = await mdb.from('customers').select('id').eq('stack_id', su.id).maybeSingle()
            if (cust?.id) { creditCustomerId = cust.id as string; storeCredit = await getStoreCreditBalance(creditCustomerId, mdb) }
          }
        }
        const plan = computeRedemption(effectiveTotal, giftCardBalance, storeCredit)
        // Aplica gift card (atómico) y luego saldo sobre el restante real.
        if (giftCardId && plan.giftCardApplied > 0) {
          giftCardAmount = await redeemGiftCard(giftCardId, plan.giftCardApplied, mdb)
        }
        const afterGc = Math.max(0, effectiveTotal - giftCardAmount)
        storeCreditAmount = Math.min(storeCredit, afterGc, use_store_credit && creditCustomerId ? plan.creditApplied : 0)
        if (creditCustomerId && storeCreditAmount > 0) {
          await addStoreCredit({ customerId: creditCustomerId, delta: -storeCreditAmount, reason: 'order' }, mdb, tenantId)
        }
        if (!giftCardAmount) giftCardCodeApplied = null
        effectiveTotal = Math.max(0, effectiveTotal - giftCardAmount - storeCreditAmount)
      } catch (e) {
        // Fail-safe: ante error de canje no se cobra el crédito ni se bloquea;
        // se sigue con el monto sin crédito.
        console.error('[checkout] canje gift card/saldo:', e instanceof Error ? e.message : e)
        giftCardCodeApplied = null; giftCardAmount = 0; storeCreditAmount = 0
      }
    }
    const creditPaid = giftCardAmount + storeCreditAmount
    const creditOrderFields = {
      gift_card_code: giftCardCodeApplied,
      gift_card_amount: giftCardAmount,
      store_credit_amount: storeCreditAmount,
    }

    // ── SEGURIDAD: la pasarela se deriva SIEMPRE del servidor (instancia activa),
    // nunca del `payment_method` que envía el cliente. ADR-004: resuelve la
    // instancia activa (integration_instances) con fallback al legacy payment_config.
    const active = await resolveActivePayment(createServerClient(), tenantId)
    const activeProvider = active?.provider ?? 'none'

    // E17/HU-157: la base URL (webhook + return de pagos) sale del host del
    // tenant (subdominio/dominio propio), no de una env global. Fallback a
    // NEXT_PUBLIC_SITE_URL en single-tenant/dev.
    const siteUrl = baseUrlFromRequest(req)

    // ── HU-156: provisioning del cliente + enlace del pedido. Si hay sesión,
    // asegura la fila en `customers` (vincula por stack_id / email, reclama
    // pedidos de invitado previos) y enlaza el pedido con `customer_id`. Para
    // invitados queda `null` y se reclama cuando el email se registre. Nunca
    // bloquea el checkout.
    let customerId: string | undefined
    try {
      const sessionUser = await stackServerApp.getUser()
      if (sessionUser?.id && sessionUser?.primaryEmail) {
        const customer = await ensureCustomer({
          stackUserId: sessionUser.id,
          email: sessionUser.primaryEmail,
          name,
          tenantId,
        }, getMachineDb(tenantId))
        customerId = customer.id
      }
    } catch {
      /* provisioning best-effort: no bloquear el checkout */
    }

    // Guarda la dirección del usuario logueado (silencioso, no bloquea el checkout)
    const autoSaveAddress = async () => {
      try {
        const sessionUser = await stackServerApp.getUser()
        if (sessionUser?.id && sessionUser?.primaryEmail) {
          saveAddressForUser(sessionUser.id, sessionUser.primaryEmail, {
            name,
            phone: phone ?? null,
            address: address.address,
            city: address.city,
            department: address.department ?? null,
            postal_code: address.postal_code ?? null,
          }, tenantId)
        }
      } catch { /* non-critical */ }
    }

    // ── HU-148 · Pago TOTAL con crédito: si gift card + saldo cubren todo, no
    // hay pasarela. Se crea la orden pagada (manual/approved), se aplica stock
    // (idempotente) y se enlaza el consumo de saldo al pedido.
    if (creditPaid > 0 && effectiveTotal <= 0) {
      const mdb = getMachineDb(tenantId)
      const order = await createOrder({
        tenant_id: tenantId,
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone ?? null,
        shipping_addr: address,
        items: orderItems,
        subtotal: serverSubtotal,
        shipping_cost: shipping_cost ?? 0,
        discount: effectiveDiscount,
        total: 0,
        payment_method: 'manual',
        payment_status: 'approved',
        skydropx_rate_id,
        carrier_name,
        ...creditOrderFields,
      }, mdb)
      await applyStockForOrder(order.order_number).catch((e) => console.error('[checkout] applyStock credit:', e instanceof Error ? e.message : e))
      await autoSaveAddress()
      return NextResponse.json({ order_number: order.order_number, order_id: order.id, payment_url: null, manual: true, paid_with_credit: true })
    }

    // ── Caso 'none': no hay pasarela de pago activa → el pedido se crea como
    // 'manual' y queda payment_status 'pending', sujeto a validación del
    // administrador. No se genera ningún pago en línea.
    if (activeProvider === 'none') {
      const order = await createOrder({
        tenant_id: tenantId,
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone ?? null,
        shipping_addr: address,
        items: orderItems,
        subtotal: serverSubtotal,
        shipping_cost: shipping_cost ?? 0,
        discount: effectiveDiscount,
        total: effectiveTotal,
        payment_method: 'manual',
        skydropx_rate_id,
        carrier_name,
        ...creditOrderFields,
      }, getMachineDb(tenantId))
      await autoSaveAddress()
      return NextResponse.json({
        order_number: order.order_number,
        order_id: order.id,
        payment_url: null,
        manual: true,
      })
    }

    // ── Tu Compra (modalidad integrador): transaccional por medio de pago.
    // El cliente eligió el medio (PSE/Nequi/…) y sus datos; el servidor arma la
    // transacción con Referencia=order_number → urlBanco. Los IDs de método son
    // configurables (payment_config.tucompra_methods; difieren demo/prod).
    if (activeProvider === 'tucompra') {
      const tc = (tucompra ?? {}) as {
        method?: string; bankCode?: string; bankName?: string; personType?: string; document?: string; docType?: string; phone?: string
      }
      const methods = (Array.isArray(active?.settings?.methods) ? active!.settings.methods : []) as Array<{ tipo: string; id: string; enabled?: boolean }>
      const cfgMethod = methods.find((m) => m.tipo === tc.method && m.enabled !== false)
      if (!tc.method || !cfgMethod?.id) {
        return NextResponse.json({ error: 'Selecciona un medio de pago de Tu Compra.' }, { status: 400 })
      }
      if (tc.method === 'pse' && !tc.bankCode) {
        return NextResponse.json({ error: 'Selecciona tu banco para PSE.' }, { status: 400 })
      }
      // Tu Compra exige el documento del comprador en TODOS los medios (PSE incluido).
      if (!tc.document || !tc.document.trim()) {
        return NextResponse.json({ error: 'Ingresa tu número de documento (cédula) para pagar con Tu Compra.' }, { status: 400 })
      }

      const order = await createOrder({
        tenant_id: tenantId,
        customer_id: customerId,
        customer_name: name, customer_email: email, customer_phone: phone ?? null,
        shipping_addr: address, items: orderItems, subtotal: serverSubtotal, shipping_cost: shipping_cost ?? 0, discount: effectiveDiscount, total: effectiveTotal,
        payment_method: 'tucompra', skydropx_rate_id, carrier_name, ...creditOrderFields,
      }, getMachineDb(tenantId))
      await autoSaveAddress()

      const tcCreds = active!.credentials
      const gw = new TuCompraGateway({
        usuario:   tcCreds.user!,
        clave:     tcCreds.password!,
        terminal:  tcCreds.terminal!,
        apiUrl:    (active!.settings.api_url as string | undefined) ?? undefined,
        publicKey: tcCreds.public_key ?? undefined,
      })
      const returnUrl = `${siteUrl}/checkout/confirmation?order=${order.order_number}`
      const metodo = tc.method === 'pse'
        ? TuCompraGateway.metodoPSE(cfgMethod.id, tc.bankCode!, tc.bankName ?? '', tc.personType === '1' ? '1' : '0', returnUrl)
        : TuCompraGateway.metodoSimple(cfgMethod.id)

      try {
        const result = await gw.createIntegradorTransaction({
          referencia: order.order_number,
          valorTotal: effectiveTotal,
          descripcion: `Pedido ${order.order_number}`,
          correo: email,
          nombre: name,
          celular: tc.phone ?? phone ?? undefined,
          telefono: phone ?? undefined,
          documento: tc.document ?? undefined,
          tipoDocumento: tc.docType ?? undefined,
          ciudad: address.city,
          pais: 'CO',
        }, metodo)

        console.log('[checkout/tucompra] result:', JSON.stringify(result), 'método:', tc.method, 'id:', cfgMethod.id)

        // Persistir el CodigoSeguimiento (obligatorio para consultar estado y para
        // finalizar Daviplata) y el número de transacción en la orden.
        if (result.codigoSeguimiento || result.numeroTransaccion) {
          await createServerClient()
            .from('orders')
            .update({
              tucompra_codigo_seguimiento: result.codigoSeguimiento ?? null,
              tucompra_numero_transaccion: result.numeroTransaccion ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)
        }

        // Se distingue el RECHAZO del cliente (código 1) del ERROR/CONFIGURACIÓN
        // (código 99). En ambos casos se marca el pedido rechazado (no huérfano).
        if (result.codigoRespuesta === '1' || result.codigoRespuesta === '99') {
          await createServerClient()
            .from('orders')
            .update({ payment_status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', order.id)

          if (result.codigoRespuesta === '1') {
            // Rechazo de la entidad (resultado de negocio, NO error de servidor).
            console.warn('[checkout/tucompra] rechazada →', result.descripcion, 'estado:', result.estado)
            const motivo = (result.descripcion ?? '').replace(/^\s*\d+\s*-\s*/, '').trim()
            return NextResponse.json({
              rejected: true,
              error: motivo ? `Pago rechazado: ${motivo}` : 'El pago fue rechazado. Intenta con otro banco o medio de pago.',
            }, { status: 402 })
          }

          // Código 99 = error inesperado / medio no configurado o inactivo. Es un
          // problema de configuración del comercio, no del comprador: se registra el
          // detalle técnico para el admin y se muestra un mensaje genérico al cliente.
          console.error('[checkout/tucompra] error/config (código 99) →', result.descripcion, 'método:', tc.method)
          return NextResponse.json({
            error: 'Este medio de pago no está disponible en este momento. Por favor intenta con otro medio.',
          }, { status: 502 })
        }

        // Flujo según el medio de pago (cada uno es distinto en la modalidad integrador).
        const base = { order_number: order.order_number, order_id: order.id, codigoSeguimiento: result.codigoSeguimiento ?? null }
        if (tc.method === 'pse') {
          // Producción: redirección a la página del banco.
          if (result.urlBanco) {
            return NextResponse.json({ ...base, tucompra: { method: 'pse', flow: 'redirect' }, payment_url: result.urlBanco })
          }
          // Demo (bancos de prueba APROBADAS/RECHAZADAS/PENDIENTES) o resolución
          // inmediata: no hay urlBanco. Si la transacción se aceptó (código 0), se
          // envía a confirmación y el reconcile determina el estado real por API.
          if (result.codigoRespuesta === '0' || result.codigoRespuesta === '2') {
            return NextResponse.json({ ...base, tucompra: { method: 'pse', flow: 'confirm' } })
          }
          return NextResponse.json({ error: `Tu Compra no devolvió la URL del banco (código ${result.codigoRespuesta}).` }, { status: 502 })
        }
        if (tc.method === 'referenciado') {
          // Comprobante/PDF con código de barras; el pedido queda pendiente hasta el pago.
          return NextResponse.json({ ...base, tucompra: { method: 'referenciado', flow: 'voucher', voucher_url: result.urlBanco ?? null } })
        }
        if (tc.method === 'nequi') {
          // Push a la app Nequi: el cliente aprueba en su teléfono; luego se consulta estado.
          return NextResponse.json({ ...base, tucompra: { method: 'nequi', flow: 'push' } })
        }
        if (tc.method === 'daviplata') {
          // Requiere OTP: el cliente ingresa el código y se llama finalizaPagoDaviplata.
          return NextResponse.json({ ...base, tucompra: { method: 'daviplata', flow: 'otp' } })
        }
        // Fallback defensivo.
        return NextResponse.json({ ...base, tucompra: { method: tc.method, flow: 'unknown' }, payment_url: result.urlBanco ?? null })
      } catch (err) {
        console.error('[checkout/tucompra] transacción falló:', err)
        return NextResponse.json({ error: 'No se pudo iniciar el pago con Tu Compra.' }, { status: 502 })
      }
    }

    // ── Pasarela activa: construir el gateway desde la instancia activa
    let gateway
    try {
      gateway = gatewayFromInstance(active!.provider, active!.credentials, active!.settings)
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Pasarela de pago no disponible'
      console.error(`[checkout] 503: gatewayFromInstance("${activeProvider}") — ${reason}`)
      return NextResponse.json({ error: reason }, { status: 503 })
    }

    // Crear la orden en la BD (payment_status: 'pending')
    const order = await createOrder({
      tenant_id: tenantId,
      customer_id: customerId,
      customer_name: name,
      customer_email: email,
      customer_phone: phone ?? null,
      shipping_addr: address,
      items: orderItems,
      subtotal: serverSubtotal,
      shipping_cost: shipping_cost ?? 0,
      discount: effectiveDiscount,
      total: effectiveTotal,
      payment_method: activeProvider as 'wompi' | 'mercadopago' | 'tucompra' | 'bold',
      skydropx_rate_id,
      carrier_name,
      ...creditOrderFields,
    }, getMachineDb(tenantId))

    await autoSaveAddress()

    const confirmUrl = `${siteUrl}/checkout/confirmation?order=${order.order_number}`

    const payment_url = await gateway.createPaymentUrl({
      orderNumber: order.order_number,
      amountInCents: Math.round(effectiveTotal * 100),
      currency: 'COP',
      customerEmail: email,
      customerName: name,
      customerPhone: phone ?? undefined,
      items: (orderItems as Array<{ variant_id: number; product_name?: string; qty: number; price?: number }>).map((i) => ({
        id: String(i.variant_id),
        title: i.product_name ?? '',
        quantity: i.qty,
        unit_price: i.price ?? 0,
      })),
      redirectUrl: confirmUrl,
      webhookUrl: `${siteUrl}/api/webhooks/${activeProvider}`,
    })

    return NextResponse.json({
      order_number: order.order_number,
      order_id: order.id,
      payment_url,
    })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
