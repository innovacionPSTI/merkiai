/**
 * Reconciliación de pagos Tu Compra (HU-188).
 *
 * Tu Compra NO tiene webhook: el estado se obtiene consultando su API REST
 * (`consultarEstadoTransaccion`) por la referencia (order_number). Se dispara al
 * volver a la página de confirmación y desde el admin. El estado proviene SIEMPRE
 * de la API autenticada de Tu Compra, nunca del cliente. Idempotente y seguro:
 * solo actúa sobre pedidos `tucompra` en estado `pending`.
 */

import { createServerClient, resolveActivePayment, resolveEmailConfig, TuCompraGateway, applyStockForOrder } from '@merkiai/database'
import type { Order, Database } from '@merkiai/database'
import { sendOrderConfirmation, buildEmailConfig, deliverStorefrontEmail } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import { amountCoversOrder } from '@/lib/payment-guards'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type ReconcileStatus = 'approved' | 'rejected' | 'pending'

export interface ReconcileResult {
  ok: boolean
  status?: ReconcileStatus
  reason?: 'not_found' | 'not_tucompra' | 'not_configured' | 'no_data'
}

export async function reconcileTuCompraOrder(orderNumber: string): Promise<ReconcileResult> {
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('payment_method, payment_status, tucompra_codigo_seguimiento, total, tenant_id')
    .eq('order_number', orderNumber)
    .single()

  if (!order) return { ok: false, reason: 'not_found' }
  if (order.payment_method !== 'tucompra') return { ok: false, reason: 'not_tucompra' }

  if (order.payment_status === 'approved') return { ok: true, status: 'approved' }
  if (order.payment_status !== 'pending') {
    return { ok: true, status: order.payment_status as ReconcileStatus }
  }

  const active = await resolveActivePayment(supabase, order.tenant_id).catch(() => null)
  if (!active || active.provider !== 'tucompra' || !active.credentials.user || !active.credentials.password || !active.credentials.terminal) {
    return { ok: false, reason: 'not_configured' }
  }

  const gateway = new TuCompraGateway({
    usuario:  active.credentials.user,
    clave:    active.credentials.password,
    terminal: active.credentials.terminal,
    apiUrl:   (active.settings.api_url as string | undefined) ?? undefined,
  })

  const result = await gateway.queryStatusByReference(orderNumber, order.tucompra_codigo_seguimiento ?? '')
  if (!result) return { ok: true, status: 'pending', reason: 'no_data' }
  if (result.status === 'pending') return { ok: true, status: 'pending' }

  // Guarda anti-subpago: si el pago aprobado no cubre el total, se deja pendiente.
  if (result.status === 'approved' && !amountCoversOrder(result.amountCop, order.total)) {
    console.warn(`[tucompra-reconcile] SUBPAGO order="${orderNumber}" pagado=${result.amountCop} total=${order.total}; se deja pendiente`)
    return { ok: true, status: 'pending' }
  }

  const paymentStatus = result.status

  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
    ...(result.paymentId ? { payment_id: result.paymentId } : {}),
    ...(paymentStatus === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', orderNumber)
    .select()
    .single()

  if (error || !updatedOrder) return { ok: true, status: paymentStatus }

  if (paymentStatus === 'approved') {
    await applyStockForOrder(orderNumber)

    const ec = await resolveEmailConfig(supabase, order.tenant_id).catch(() => null)
    const emailConfig = ec ? buildEmailConfig(ec.apiKey, ec.fromEmail, ec.storeName, ec.provider) : null

    if (emailConfig) {
      await deliverStorefrontEmail(supabase, { tenantId: order.tenant_id, type: 'order.confirmed', to: updatedOrder.customer_email, entity: orderNumber, provider: ec?.provider }, () => sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig))
    }

    const shipment = await createShipmentForOrder(orderNumber)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single()
      if (shippedOrder?.tracking_number) {
        const { sendShippingNotification } = await import('@/lib/email')
        await deliverStorefrontEmail(supabase, { tenantId: order.tenant_id, type: 'order.shipped', to: updatedOrder.customer_email, entity: orderNumber, provider: ec?.provider }, () => sendShippingNotification(shippedOrder as unknown as Order, emailConfig))
      }
    }
  }

  return { ok: true, status: paymentStatus }
}
