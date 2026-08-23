import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig, applyStockForOrder, markWebhookEventProcessed } from '@vps/database'
import { verifyWompiWebhook, isWompiTimestampFresh, mapWompiStatus } from '@/lib/wompi'
import { amountCoversOrder } from '@/lib/payment-guards'
import { sendOrderConfirmation, sendShippingNotification, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@vps/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Webhook de Wompi — evento transaction.updated
 * Docs: https://docs.wompi.co/docs/en/events
 *
 * Cabeceras:
 *   x-timestamp  — Unix timestamp en milisegundos
 *   x-checksum   — SHA256(payload + timestamp + eventsSecret)
 *
 * Las credenciales (events_secret) se cargan desde la tabla payment_config.
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const timestamp = req.headers.get('x-timestamp') ?? ''
  const checksum = req.headers.get('x-checksum') ?? ''

  // Cargar credenciales desde la BD
  const paymentConfig = await getPaymentConfig().catch(() => null)
  const eventsSecret = paymentConfig?.wompi_events_secret ?? ''

  if (!verifyWompiWebhook(rawBody, timestamp, checksum, eventsSecret)) {
    console.warn('[webhook/wompi] Firma inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Ventana de replay: rechaza eventos con timestamp fuera de ±5 min.
  if (!isWompiTimestampFresh(timestamp)) {
    console.warn('[webhook/wompi] Timestamp fuera de ventana (posible replay)')
    return NextResponse.json({ error: 'Stale timestamp' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event !== 'transaction.updated') {
    return NextResponse.json({ ok: true })
  }

  const data = event.data as Record<string, unknown> | undefined
  const transaction = data?.transaction as Record<string, unknown> | undefined

  if (!transaction) return NextResponse.json({ ok: true })

  const reference = transaction.reference as string | undefined
  const wompiStatus = transaction.status as string | undefined
  const paymentId = transaction.id as string | undefined
  const amountInCents = typeof transaction.amount_in_cents === 'number' ? transaction.amount_in_cents : undefined

  if (!reference || !wompiStatus) return NextResponse.json({ ok: true })

  // Idempotencia por id de evento: no reprocesar reintentos del mismo estado.
  const { duplicate } = await markWebhookEventProcessed('wompi', `${paymentId ?? reference}:${wompiStatus}`)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  let paymentStatus = mapWompiStatus(wompiStatus)
  const supabase = createServerClient()

  // Guarda anti-subpago: si el pago aprobado no cubre el total, no se aprueba.
  if (paymentStatus === 'approved') {
    const { data: ord } = await supabase.from('orders').select('total').eq('order_number', reference).maybeSingle()
    const paidCop = amountInCents != null ? amountInCents / 100 : null
    if (ord && !amountCoversOrder(paidCop, ord.total)) {
      console.warn(`[webhook/wompi] SUBPAGO reference="${reference}" pagado=${paidCop} total=${ord.total}; se deja pendiente`)
      paymentStatus = 'pending'
    }
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
    .eq('order_number', reference)
    .select()
    .single()

  if (error) {
    console.error('[webhook/wompi] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  // Pago aprobado: confirmación + guía de envío
  if (paymentStatus === 'approved' && updatedOrder) {
    // Descuento de stock (idempotente) al confirmarse el pago
    await applyStockForOrder(reference)

    const storeConfig = await getStoreConfig().catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? buildEmailConfig(storeConfig.resend_api_key, storeConfig.resend_from_email, storeConfig.store_name)
      : null

    // Email de confirmación de pago
    if (emailConfig) {
      try {
        await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig)
      } catch (err) {
        console.error('[webhook/wompi] Error email confirmación:', err)
      }
    }

    // Generar guía Skydropx (no bloquea — falla silenciosa)
    const shipment = await createShipmentForOrder(reference)
    if (shipment && emailConfig) {
      // Reload order para tener tracking_number actualizado
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', reference)
        .single()
      if (shippedOrder?.tracking_number) {
        try {
          await sendShippingNotification(
            shippedOrder as unknown as Order & { tracking_number: string; carrier_name: string | null; label_url: string | null },
            emailConfig,
          )
        } catch (err) {
          console.error('[webhook/wompi] Error email tracking:', err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
