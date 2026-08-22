/**
 * Núcleo compartido de reconciliación de pagos Tu Compra (Épica 6 · HU-188).
 *
 * Tu Compra NO tiene webhook (su API REST es pull): el estado se obtiene
 * consultando `consultarEstadoTransaccion` por la referencia (order_number).
 * Esta función lo hace de forma idempotente y segura: solo actúa sobre pedidos
 * `tucompra` en estado `pending`, y el estado proviene SIEMPRE de la API
 * autenticada de Tu Compra, nunca del cliente.
 *
 * Vive en @vps/database para que web y admin lo llamen DIRECTO. Los efectos
 * web-only (email + guía de envío) los añade la app web sobre este núcleo.
 */

import { createServerClient } from '../client'
import { getPaymentConfig } from '../queries/payment-config'
import { TuCompraGateway } from '../providers/payment/TuCompraGateway'
import { applyStockForOrder } from './stock'
import type { Database } from '../types'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

type ReconcileStatus = 'approved' | 'rejected' | 'pending'

export interface TuCompraReconcileResult {
  ok: boolean
  status?: ReconcileStatus
  reason?: 'not_found' | 'not_tucompra' | 'not_configured' | 'no_data'
}

export async function reconcileTuCompraOrder(orderNumber: string): Promise<TuCompraReconcileResult> {
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('payment_method, payment_status')
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
