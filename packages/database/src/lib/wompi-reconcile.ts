/**
 * Núcleo compartido de reconciliación de pagos Wompi (integración completa).
 *
 * Re-consulta la API autenticada de Wompi por el id de transacción (el que llega
 * en el redirect `?id=` o el `payment_id` ya guardado) y actualiza el estado del
 * pago + descuenta el stock. Es idempotente y seguro: solo actúa sobre pedidos
 * `wompi` en estado `pending`, el estado proviene SIEMPRE de la API de Wompi
 * (nunca del cliente) y aplica la guarda anti-subpago.
 *
 * Vive en @merkiai/database para que web y admin lo llamen DIRECTO. Los efectos
 * web-only (email con plantillas de la tienda, guía Skydropx) los añade la app
 * web sobre este núcleo cuando corresponde.
 */

import { createServerClient } from '../client'
import { resolveActivePayment } from '../providers/payment/resolve'
import { WompiGateway } from '../providers/payment/WompiGateway'
import { applyStockForOrder } from './stock'
import type { Database } from '../types'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type WompiReconcileStatus = 'approved' | 'rejected' | 'pending'

export interface WompiReconcileResult {
  ok: boolean
  status?: WompiReconcileStatus
  reason?: 'not_found' | 'not_wompi' | 'not_configured' | 'no_data' | 'no_txn'
}

/** Guarda anti-subpago: el valor pagado debe cubrir el total (1 COP de tolerancia). */
function covers(paidCop: number | null | undefined, orderTotal: number): boolean {
  if (paidCop == null || !Number.isFinite(paidCop)) return true
  return Math.round(paidCop) + 1 >= orderTotal
}

export async function reconcileWompiOrder(
  orderNumber: string,
  transactionId?: string | null,
): Promise<WompiReconcileResult> {
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('payment_method, payment_status, tenant_id, total, payment_id')
    .eq('order_number', orderNumber)
    .single()

  if (!order) return { ok: false, reason: 'not_found' }
  if (order.payment_method !== 'wompi') return { ok: false, reason: 'not_wompi' }
  if (order.payment_status === 'approved') return { ok: true, status: 'approved' }
  if (order.payment_status !== 'pending') {
    return { ok: true, status: order.payment_status as WompiReconcileStatus }
  }

  // El id de transacción puede venir del redirect (?id=) o ya estar guardado.
  const txnId = transactionId || (order.payment_id as string | null) || null
  if (!txnId) return { ok: true, status: 'pending', reason: 'no_txn' }

  // ADR-004: credenciales desde la instancia activa (fallback legacy interno).
  const active = await resolveActivePayment(supabase, order.tenant_id).catch(() => null)
  if (!active || active.provider !== 'wompi' || !active.credentials.public_key) return { ok: false, reason: 'not_configured' }

  const gateway = new WompiGateway({
    publicKey: active.credentials.public_key,
    integritySecret: active.credentials.integrity_secret ?? '',
    eventsSecret: active.credentials.events_secret ?? undefined,
    privateKey: active.credentials.private_key ?? undefined,
  })

  const result = await gateway.queryTransaction(txnId)
  if (!result) return { ok: true, status: 'pending', reason: 'no_data' }
  if (result.status === 'pending') return { ok: true, status: 'pending' }

  // Anti-subpago: un pago aprobado que no cubre el total se deja pendiente.
  let paymentStatus: WompiReconcileStatus = result.status
  if (paymentStatus === 'approved' && !covers(result.amountCop, order.total)) {
    console.warn(`[wompi-reconcile] SUBPAGO order="${orderNumber}" pagado=${result.amountCop} total=${order.total}; pendiente`)
    paymentStatus = 'pending'
  }

  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
    payment_id: result.paymentId,
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
