import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig, BoldGateway, applyStockForOrder } from '@vps/database'
import { sendOrderConfirmation, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@vps/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Webhook de Bold — confirmación de pago (POST JSON, CloudEvents).
 * Doc: https://developers.bold.co/webhook
 *
 * Seguridad: se verifica la firma HMAC-SHA256(base64(body)) contra el header
 * `x-bold-signature` ANTES de tocar cualquier estado. En sandbox la llave secreta
 * es un string vacío. Idempotente: reintentos de un pago ya aprobado responden 200.
 *
 * Correlación del pedido: `data.metadata.reference` = order_number.
 * Eventos: SALE_APPROVED, SALE_REJECTED, VOID_APPROVED, VOID_REJECTED.
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const paymentConfig = await getPaymentConfig().catch(() => null)

  // Se valida por credenciales (no por proveedor activo): una notificación puede
  // llegar por un pago iniciado aunque luego se cambie la pasarela activa.
  if (!paymentConfig?.bold_api_key) {
    console.warn('[webhook/bold] Bold no configurado')
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
  }

  const gateway = new BoldGateway({
    apiKey:    paymentConfig.bold_api_key,
    secretKey: paymentConfig.bold_secret_key ?? '',
    sandbox:   paymentConfig.bold_sandbox ?? true,
  })

  // 1) Verificar firma ANTES de cualquier cambio de estado
  const signature = req.headers.get('x-bold-signature')
  if (!gateway.verifyWebhook(rawBody, { 'x-bold-signature': signature })) {
    console.warn('[webhook/bold] Firma inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const webhookData = gateway.extractWebhookData(rawBody)
  if (!webhookData) {
    return NextResponse.json({ ok: true })
  }

  const { orderReference, rawStatus, paymentId } = webhookData
  const paymentStatus = gateway.mapStatus(rawStatus)

  const supabase = createServerClient()

  // 2) Idempotencia: si el pago ya estaba aprobado y llega otro SALE_APPROVED, no reprocesar
  const { data: existing } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('order_number', orderReference)
    .single()

  if (existing?.payment_status === 'approved' && paymentStatus === 'approved') {
    return NextResponse.json({ ok: true, idempotent: true })
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
    .single()

  if (error) {
    console.error('[webhook/bold] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  // 3) Pago aprobado: confirmación + guía de envío (fallas silenciosas)
  if (paymentStatus === 'approved' && updatedOrder) {
    // Descuento de stock (idempotente) al confirmarse el pago
    await applyStockForOrder(orderReference)

    const storeConfig = await getStoreConfig().catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? buildEmailConfig(
          storeConfig.resend_api_key,
          storeConfig.resend_from_email,
          storeConfig.store_name,
          storeConfig.email_provider,
        )
      : null

    if (emailConfig) {
      try {
        await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig)
      } catch (err) {
        console.error('[webhook/bold] Error email confirmación:', err)
      }
    }

    const shipment = await createShipmentForOrder(orderReference)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderReference)
        .single()
      if (shippedOrder?.tracking_number) {
        try {
          const { sendShippingNotification } = await import('@/lib/email')
          await sendShippingNotification(shippedOrder as unknown as Order, emailConfig)
        } catch (err) {
          console.error('[webhook/bold] Error email envío:', err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
