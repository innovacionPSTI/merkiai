import { NextRequest, NextResponse } from 'next/server'
import { resolveActivePayment, resolveEmailConfig, PayzenGateway, applyStockForOrder, markWebhookEventProcessed } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'
import { amountCoversOrder } from '@/lib/payment-guards'
import { hydrateManagedPayment, reportMerkiaiFee, MERKIAI_PAGOS } from '@/lib/merkiai-pagos'
import { sendOrderConfirmation, buildEmailConfig, deliverStorefrontEmail } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@merkiai/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * IPN de PayZen/Lyra — confirmación de pago de las ventas de la tienda (HU-442).
 * POST form-urlencoded: `kr-answer` (JSON) + `kr-hash` = HMAC-SHA256 hex de
 * `kr-answer` con la contraseña REST de la tienda PayZen del tenant.
 *
 * Seguridad: firma verificada ANTES de tocar estado. Idempotente: PayZen reenvía
 * la IPN (cada 15 min, hasta 4 veces) si no recibe 2xx.
 * Correlación del pedido: `orderDetails.orderId` = order_number.
 * Estados: PAID → aprobado · UNPAID → rechazado · RUNNING/ABANDONED → pendiente.
 *
 * HU-441 · también atiende "Merkiai Pagos" (tienda PayZen gestionada): las
 * credenciales vienen de la consola y, si el pago se aprueba, se causa la
 * comisión de Merkiai ANTES de tocar el pedido (si falla → 5xx y PayZen reintenta).
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // HU-216: el webhook resuelve el TENANT por su host (el checkout configura las
  // URLs de callback con el subdominio del tenant) → carga la config de pago de
  // ESE tenant, no la del default.
  const { tenantId } = await resolveTenant()
  const supabase = getMachineDb(tenantId) // HU-227: RLS por tenant (antes service-role)
  // ADR-004: credenciales desde la instancia activa (fallback legacy interno).
  let active
  try {
    active = await hydrateManagedPayment(await resolveActivePayment(supabase, tenantId).catch(() => null), tenantId)
  } catch (err) {
    console.error('[webhook/payzen] Merkiai Pagos no disponible:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Gateway unavailable' }, { status: 503 })
  }
  const managed = active?.provider === MERKIAI_PAGOS
  if (!active || (active.provider !== 'payzen' && !managed) || !active.credentials.shop_id || !active.credentials.password) {
    console.warn('[webhook/payzen] PayZen no es la pasarela activa o no está configurado')
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
  }

  const gateway = new PayzenGateway({ shopId: active.credentials.shop_id, password: active.credentials.password })

  // 1) Verificar firma ANTES de cualquier cambio de estado
  if (!gateway.verifyWebhook(rawBody)) {
    console.warn('[webhook/payzen] Firma inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const webhookData = gateway.extractWebhookData(rawBody)
  if (!webhookData) {
    return NextResponse.json({ ok: true })
  }

  const { orderReference, rawStatus, paymentId, amountCop } = webhookData
  let paymentStatus = gateway.mapStatus(rawStatus)

  // HU-441 · comisión de Merkiai Pagos (idempotente en la consola por paymentId).
  if (managed && paymentStatus === 'approved' && paymentId && amountCop != null) {
    const ok = await reportMerkiaiFee(tenantId, { paymentId, orderNumber: orderReference, amountCents: Math.round(amountCop * 100) })
    if (!ok) {
      console.error(`[webhook/payzen] no se pudo causar la comisión de ${orderReference}; se pide reintento`)
      return NextResponse.json({ error: 'fee_not_recorded' }, { status: 500 })
    }
  }

  // Idempotencia por id de evento (no reprocesar reintentos del mismo evento).
  const { duplicate } = await markWebhookEventProcessed('payzen', `${orderReference}:${rawStatus}:${paymentId ?? ''}`)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  // 2) Idempotencia: si el pago ya estaba aprobado y llega otra IPN PAID, no reprocesar
  const { data: existing } = await supabase
    .from('orders')
    .select('payment_status, total')
    .eq('order_number', orderReference)
    .single()

  if (existing?.payment_status === 'approved' && paymentStatus === 'approved') {
    return NextResponse.json({ ok: true, idempotent: true })
  }

  // Guarda anti-subpago: el monto viene del payload firmado de PayZen.
  if (paymentStatus === 'approved' && existing && !amountCoversOrder(amountCop, existing.total)) {
    console.warn(`[webhook/payzen] SUBPAGO reference="${orderReference}" pagado=${amountCop} total=${existing.total}; se deja pendiente`)
    paymentStatus = 'pending'
  }

  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
    ...(paymentId ? { payment_id: paymentId } : {}),
    ...(paymentStatus === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', orderReference)
    .select()
    .maybeSingle()

  if (error) {
    console.error('[webhook/payzen] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  // Sin fila: la referencia no corresponde a ninguna orden (p. ej. prueba desde el
  // Back Office de PayZen). Se responde 200 para no forzar reintentos.
  if (!updatedOrder) {
    console.warn(`[webhook/payzen] Sin orden para reference="${orderReference}" (evento ${rawStatus}); se ignora`)
    return NextResponse.json({ ok: true, warning: 'order_not_found' })
  }

  // 3) Pago aprobado: confirmación + guía de envío (fallas silenciosas)
  if (paymentStatus === 'approved' && updatedOrder) {
    // Descuento de stock (idempotente) al confirmarse el pago
    await applyStockForOrder(orderReference)

    const ec = await resolveEmailConfig(supabase, tenantId).catch(() => null)
    const emailConfig = ec ? buildEmailConfig(ec.apiKey, ec.fromEmail, ec.storeName, ec.provider) : null

    if (emailConfig) {
      await deliverStorefrontEmail(supabase, { tenantId, type: 'order.confirmed', to: updatedOrder.customer_email, entity: orderReference, provider: ec?.provider }, () => sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig))
    }

    const shipment = await createShipmentForOrder(orderReference)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderReference)
        .single()
      if (shippedOrder?.tracking_number) {
        const { sendShippingNotification } = await import('@/lib/email')
        await deliverStorefrontEmail(supabase, { tenantId, type: 'order.shipped', to: updatedOrder.customer_email, entity: orderReference, provider: ec?.provider }, () => sendShippingNotification(shippedOrder as unknown as Order, emailConfig))
      }
    }
  }

  return NextResponse.json({ ok: true })
}
