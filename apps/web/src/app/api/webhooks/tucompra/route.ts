import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig, TuCompraGateway, applyStockForOrder } from '@vps/database'
import { sendOrderConfirmation, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@vps/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * URL de Confirmación de Tu Compra (server-to-server).
 *
 * Se configura en el panel del comercio (Tu Compra → URL de Confirmación).
 * Tu Compra hace POST aquí con el resultado del pago. NO confiamos en el payload:
 * se extrae la referencia (order_number) y se re-consulta el estado autoritativo
 * a la API (`consultarEstadoTransaccion`). Idempotente.
 *
 * (La URL de Retorno es distinta: redirige el navegador del cliente a la página
 * de confirmación; esa NO confirma el pago.)
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const paymentConfig = await getPaymentConfig().catch(() => null)
  if (!paymentConfig?.tucompra_user || !paymentConfig.tucompra_password || !paymentConfig.tucompra_terminal) {
    console.warn('[webhook/tucompra] Tu Compra no configurado')
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
  }

  const gateway = new TuCompraGateway({
    usuario:   paymentConfig.tucompra_user,
    clave:     paymentConfig.tucompra_password,
    terminal:  paymentConfig.tucompra_terminal,
    apiUrl:    paymentConfig.tucompra_api_url ?? undefined,
    publicKey: paymentConfig.tucompra_public_key ?? undefined,
  })

  const webhookData = gateway.extractWebhookData(rawBody)
  if (!webhookData) return NextResponse.json({ ok: true })
  const orderReference = webhookData.orderReference

  // Estado autoritativo: re-consulta a la API (no se confía en el payload).
  const status = await gateway.queryStatusByReference(orderReference)
  if (!status) {
    console.warn(`[webhook/tucompra] Sin estado para reference="${orderReference}"; se ignora`)
    return NextResponse.json({ ok: true, warning: 'no_status' })
  }
  const paymentStatus = status.status
  const paymentId = status.paymentId

  const supabase = createServerClient()
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
    console.error('[webhook/tucompra] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }
  if (!updatedOrder) {
    console.warn(`[webhook/tucompra] Sin orden para reference="${orderReference}"`)
    return NextResponse.json({ ok: true, warning: 'order_not_found' })
  }

  if (paymentStatus === 'approved') {
    await applyStockForOrder(orderReference)

    const storeConfig = await getStoreConfig().catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? buildEmailConfig(storeConfig.resend_api_key, storeConfig.resend_from_email, storeConfig.store_name, storeConfig.email_provider)
      : null

    if (emailConfig) {
      try { await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig) }
      catch (err) { console.error('[webhook/tucompra] Error email confirmación:', err) }
    }

    const shipment = await createShipmentForOrder(orderReference)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase.from('orders').select('*').eq('order_number', orderReference).single()
      if (shippedOrder?.tracking_number) {
        try {
          const { sendShippingNotification } = await import('@/lib/email')
          await sendShippingNotification(shippedOrder as unknown as Order, emailConfig)
        } catch (err) { console.error('[webhook/tucompra] Error email envío:', err) }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
