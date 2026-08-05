/**
 * Reconciliación de pagos Bold vía el servicio de fallback (HU-095).
 *
 * Cuando el webhook de Bold no llega (hasta ~10 min de demora en link de pagos),
 * consultamos el estado real por la referencia externa (order_number) y
 * actualizamos el pedido. El estado proviene SIEMPRE de la API autenticada de
 * Bold, nunca del cliente. Idempotente y seguro: solo actúa sobre pedidos
 * `bold` en estado `pending`.
 */

import { createServerClient, getPaymentConfig, getStoreConfig, BoldGateway, applyStockForOrder } from '@vps/database'
import type { Order, Database } from '@vps/database'
import { sendOrderConfirmation, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type ReconcileStatus = 'approved' | 'rejected' | 'pending'

export interface ReconcileResult {
  ok: boolean
  status?: ReconcileStatus
  reason?: 'not_found' | 'not_bold' | 'not_configured' | 'no_data'
}

export async function reconcileBoldOrder(orderNumber: string): Promise<ReconcileResult> {
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('payment_method, payment_status')
    .eq('order_number', orderNumber)
    .single()

  if (!order) return { ok: false, reason: 'not_found' }
  if (order.payment_method !== 'bold') return { ok: false, reason: 'not_bold' }

  // Idempotencia / no aplica: si ya está resuelto, devolver el estado sin reconsultar Bold
  if (order.payment_status === 'approved') return { ok: true, status: 'approved' }
  if (order.payment_status !== 'pending') {
    return { ok: true, status: order.payment_status as ReconcileStatus }
  }

  const config = await getPaymentConfig().catch(() => null)
  if (!config?.bold_api_key) return { ok: false, reason: 'not_configured' }

  const gateway = new BoldGateway({
    apiKey:    config.bold_api_key,
    secretKey: config.bold_secret_key ?? '',
    sandbox:   config.bold_sandbox ?? true,
  })

  const result = await gateway.queryStatusByReference(orderNumber)
  if (!result) return { ok: true, status: 'pending', reason: 'no_data' }
  if (result.status === 'pending') return { ok: true, status: 'pending' }

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

  // Aprobado: descuento de stock + confirmación + guía de envío (mismos efectos que el webhook)
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
        console.error('[bold-reconcile] Error email confirmación:', err)
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
          console.error('[bold-reconcile] Error email envío:', err)
        }
      }
    }
  }

  return { ok: true, status: paymentStatus }
}
