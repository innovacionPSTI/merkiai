import { NextRequest, NextResponse } from 'next/server'
import { resolveActivePayment, resolveEmailConfig, applyStockForOrder, markWebhookEventProcessed } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'
import { getMercadoPagoPayment, mapMercadoPagoStatus, verifyMercadoPagoSignature } from '@/lib/mercadopago'
import { amountCoversOrder } from '@/lib/payment-guards'
import { sendOrderConfirmation, sendShippingNotification, buildEmailConfig, deliverStorefrontEmail } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@merkiai/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Webhook de MercadoPago — notificaciones IPN/Webhooks
 * Docs: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Body: { type: "payment", data: { id: "12345678" } }
 * Se consulta el estado real del pago con la API de MP.
 *
 * El access_token se carga desde la tabla payment_config.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = body.type as string | undefined
  if (type !== 'payment') return NextResponse.json({ ok: true })

  const data = body.data as Record<string, unknown> | undefined
  const paymentId = data?.id as string | undefined
  if (!paymentId) return NextResponse.json({ ok: true })

  // Cargar credenciales desde la BD
  // HU-216: config del TENANT resuelto por host (URLs de callback por subdominio).
  const { tenantId } = await resolveTenant()
  // HU-227: cliente de máquina acotado por RLS (antes service-role).
  const supabase = getMachineDb(tenantId)
  // ADR-004: credenciales desde la instancia activa (fallback legacy interno).
  const active = await resolveActivePayment(supabase, tenantId).catch(() => null)
  if (!active || active.provider !== 'mercadopago' || !active.credentials.access_token) {
    console.error('[webhook/mercadopago] MercadoPago no es la pasarela activa o falta el access_token')
    return NextResponse.json({ error: 'MP not configured' }, { status: 503 })
  }

  // Verificación de firma x-signature (defensa en profundidad; el control primario
  // es la re-consulta del pago). Solo se exige si hay un secret configurado.
  const sigValid = verifyMercadoPagoSignature({
    xSignature: req.headers.get('x-signature'),
    xRequestId: req.headers.get('x-request-id'),
    dataId: paymentId,
    secret: active.credentials.webhook_secret ?? null,
  })
  if (sigValid === false) {
    console.warn('[webhook/mercadopago] Firma x-signature inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Idempotencia por id de evento (la notificación de MP trae un id).
  const notifId = typeof body.id === 'string' || typeof body.id === 'number' ? String(body.id) : paymentId
  const { duplicate } = await markWebhookEventProcessed('mercadopago', notifId)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  let payment: Awaited<ReturnType<typeof getMercadoPagoPayment>>
  try {
    payment = await getMercadoPagoPayment(active.credentials.access_token, paymentId)
  } catch (err) {
    console.error('[webhook/mercadopago] Error consultando pago:', err)
    return NextResponse.json({ error: 'MP fetch error' }, { status: 500 })
  }

  const { status: mpStatus, external_reference: reference } = payment
  if (!reference) {
    console.warn('[webhook/mercadopago] Pago sin external_reference:', paymentId)
    return NextResponse.json({ ok: true })
  }

  let paymentStatus = mapMercadoPagoStatus(mpStatus)

  // Guarda anti-subpago: el monto lo da la API de MP (no el cliente).
  if (paymentStatus === 'approved') {
    const { data: ord } = await supabase.from('orders').select('total').eq('order_number', reference).maybeSingle()
    if (ord && !amountCoversOrder(payment.transaction_amount, ord.total)) {
      console.warn(`[webhook/mercadopago] SUBPAGO reference="${reference}" pagado=${payment.transaction_amount} total=${ord.total}; se deja pendiente`)
      paymentStatus = 'pending'
    }
  }

  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    payment_id: String(payment.id),
    updated_at: new Date().toISOString(),
    ...(paymentStatus === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', reference)
    .select()
    .single()

  if (error) {
    console.error('[webhook/mercadopago] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  if (paymentStatus === 'approved' && updatedOrder) {
    // Descuento de stock (idempotente) al confirmarse el pago
    await applyStockForOrder(reference)

    const ec = await resolveEmailConfig(supabase, tenantId).catch(() => null)
    const emailConfig = ec ? buildEmailConfig(ec.apiKey, ec.fromEmail, ec.storeName, ec.provider) : null

    // Email de confirmación de pago
    if (emailConfig) {
      await deliverStorefrontEmail(supabase, { tenantId, type: 'order.confirmed', to: updatedOrder.customer_email, entity: reference, provider: ec?.provider }, () => sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig))
    }

    // Generar guía Skydropx (no bloquea — falla silenciosa)
    const shipment = await createShipmentForOrder(reference)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', reference)
        .single()
      if (shippedOrder?.tracking_number) {
        await deliverStorefrontEmail(supabase, { tenantId, type: 'order.shipped', to: updatedOrder.customer_email, entity: reference, provider: ec?.provider }, () =>
          sendShippingNotification(
            shippedOrder as unknown as Order & { tracking_number: string; carrier_name: string | null; label_url: string | null },
            emailConfig,
          ),
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}
