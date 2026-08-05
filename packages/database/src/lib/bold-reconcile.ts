/**
 * Núcleo compartido de reconciliación de pagos Bold (Épica 6 · HU-095).
 *
 * Consulta el servicio de fallback de Bold por la referencia del pedido y
 * actualiza el estado del pago + descuenta el stock. Es idempotente y seguro:
 * solo actúa sobre pedidos `bold` en estado `pending`, y el estado proviene
 * SIEMPRE de la API autenticada de Bold, nunca del cliente.
 *
 * Vive en @vps/database para que web y admin lo llamen DIRECTO (sin saltos HTTP
 * entre apps). Los efectos secundarios web-only (email de confirmación con las
 * plantillas de la tienda y guía de envío Skydropx) los añade la app web sobre
 * este núcleo; el admin usa solo el núcleo.
 */

import { createServerClient } from '../client'
import { getPaymentConfig } from '../queries/payment-config'
import { BoldGateway } from '../providers/payment/BoldGateway'
import { applyStockForOrder } from './stock'
import type { Database } from '../types'

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

  const { data: updated, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', orderNumber)
    .select('order_number')
    .single()

  if (error || !updated) return { ok: true, status: paymentStatus }

  if (paymentStatus === 'approved') {
    await applyStockForOrder(orderNumber)
  }

  return { ok: true, status: paymentStatus }
}
