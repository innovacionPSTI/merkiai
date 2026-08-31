import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getPaymentConfig, createServerClient, getPaymentGateway, getActiveProvider, getStockForVariants, TuCompraGateway, ensureCustomer } from '@merkiai/database'
import { stackServerApp } from '@/stack'
import { baseUrlFromRequest } from '@/lib/base-url'
import { resolveTenant } from '@/lib/tenant-context'

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
    } = body

    // Extract carrier info from the rate the user selected
    const skydropx_rate_id: string | null = shipping_rate?.id ?? null
    const carrier_name: string | null = shipping_rate?.carrier_name ?? null

    if (!email || !name || !address || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // ── Validación de stock (Épica 9): rechazar si falta stock y el producto no
    // permite backorder. El servidor es la autoridad; el front es solo ayuda.
    const orderItems = items as Array<{ variant_id: number; qty: number; product_name?: string }>
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

    // Tenant del pedido (resolución por host). Nunca bloquea el checkout: si
    // falla, la BD usa el tenant por defecto.
    let tenantId: string | undefined
    try { tenantId = (await resolveTenant()).tenantId } catch { /* fallback al default */ }

    // Cargar configuración de pagos del TENANT (HU-216: no del default)
    const paymentConfig = await getPaymentConfig(createServerClient(), tenantId)
    if (!paymentConfig) {
      console.error('[checkout] 503: no existe fila en payment_config (id=1). Ejecuta el seed local o configura en admin → Configuración → Pagos.')
      return NextResponse.json({ error: 'Configuración de pagos no disponible' }, { status: 503 })
    }

    // ── SEGURIDAD: la pasarela se deriva SIEMPRE del servidor (active_provider),
    // nunca del `payment_method` que envía el cliente. Así no se puede forzar una
    // pasarela distinta a la activa ni saltarse el pago en la creación del pedido.
    const activeProvider = getActiveProvider(paymentConfig)

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
        })
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
        items,
        subtotal,
        shipping_cost: shipping_cost ?? 0,
        total,
        payment_method: 'manual',
        skydropx_rate_id,
        carrier_name,
      })
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
      const methods = (Array.isArray(paymentConfig.tucompra_methods) ? paymentConfig.tucompra_methods : []) as Array<{ tipo: string; id: string; enabled?: boolean }>
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
        shipping_addr: address, items, subtotal, shipping_cost: shipping_cost ?? 0, total,
        payment_method: 'tucompra', skydropx_rate_id, carrier_name,
      })
      await autoSaveAddress()

      const gw = new TuCompraGateway({
        usuario:   paymentConfig.tucompra_user!,
        clave:     paymentConfig.tucompra_password!,
        terminal:  paymentConfig.tucompra_terminal!,
        apiUrl:    paymentConfig.tucompra_api_url ?? undefined,
        publicKey: paymentConfig.tucompra_public_key ?? undefined,
      })
      const returnUrl = `${siteUrl}/checkout/confirmation?order=${order.order_number}`
      const metodo = tc.method === 'pse'
        ? TuCompraGateway.metodoPSE(cfgMethod.id, tc.bankCode!, tc.bankName ?? '', tc.personType === '1' ? '1' : '0', returnUrl)
        : TuCompraGateway.metodoSimple(cfgMethod.id)

      try {
        const result = await gw.createIntegradorTransaction({
          referencia: order.order_number,
          valorTotal: total,
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

    // ── Pasarela activa: resolver el gateway (server-side) antes de crear la orden
    let gateway
    try {
      gateway = getPaymentGateway(activeProvider, paymentConfig)
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Pasarela de pago no disponible'
      console.error(`[checkout] 503: getPaymentGateway("${activeProvider}") — ${reason}`)
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
      items,
      subtotal,
      shipping_cost: shipping_cost ?? 0,
      total,
      payment_method: activeProvider,
      skydropx_rate_id,
      carrier_name,
    })

    await autoSaveAddress()

    const confirmUrl = `${siteUrl}/checkout/confirmation?order=${order.order_number}`

    const payment_url = await gateway.createPaymentUrl({
      orderNumber: order.order_number,
      amountInCents: Math.round(total * 100),
      currency: 'COP',
      customerEmail: email,
      customerName: name,
      customerPhone: phone ?? undefined,
      items: (items as Array<{ variant_id: number; product_name: string; qty: number; price: number }>).map((i) => ({
        id: String(i.variant_id),
        title: i.product_name,
        quantity: i.qty,
        unit_price: i.price,
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
