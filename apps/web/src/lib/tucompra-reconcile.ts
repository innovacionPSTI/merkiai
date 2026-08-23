/**
 * Reconciliación de pagos Tu Compra (HU-188).
 *
 * Tu Compra NO tiene webhook: el estado se obtiene consultando su API REST
 * (`consultarEstadoTransaccion`) por la referencia (order_number). Se dispara al
 * volver a la página de confirmación y desde el admin. El estado proviene SIEMPRE
 * de la API autenticada de Tu Compra, nunca del cliente. Idempotente y seguro:
 * solo actúa sobre pedidos `tucompra` en estado `pending`.
 */

import { createServerClient, getPaymentConfig, getStoreConfig, TuCompraGateway, applyStockForOrder } from '@vps/database'
import type { Order, Database } from '@vps/database'
import { sendOrderConfirmation, buildEmailConfig } from '@/lib/email'
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
    .select('payment_method, payment_status, tucompra_codigo_seguimiento, total')
    .eq('order_number', orderNumber)
    .single()

  if (!order) return { ok: false, reason: 'not_found' }
  if (order.payment_method !== 'tucompra') return { ok: false, reason: 'not_tucompra' }

  if (order.payment_status === 'approved') return { ok: true, status: 'approved' }
  if (order.payment_status !== 'pending') {
    return { ok: true, status: order.payment_status as ReconcileStatus }
  }

  const config = await getPaymentConfig().catch(() => null)
  if (!config?.tucompra_user || !config.tucompra_password || !config.tucompra_terminal) {
    return { ok: false, reason: 'not_configured' }
  }

  const gateway = new TuCompraGateway({
    usuario:  config.tucompra_user,
    clave:    config.tucompra_password,
    terminal: config.tucompra_terminal,
    apiUrl:   config.tucompra_api_url ?? undefined,
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
        console.error('[tucompra-reconcile] Error email confirmación:', err)
      }
    }

    const shipment = await createShipmentForOrder(orderNumber)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single()
      if (shippedOrder?.tracking_number) {
        try {
          const { sendShippingNotification } = await import('@/lib/email')
          await sendShippingNotification(shippedOrder as unknown as Order, emailConfig)
        } catch (err) {
          console.error('[tucompra-reconcile] Error email envío:', err)
        }
      }
    }
  }

  return { ok: true, status: paymentStatus }
}
