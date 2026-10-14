import type { Db } from '../client'
import type { OrderReturn, Database } from '../types'

type ReturnUpdate = Database['public']['Tables']['order_returns']['Update']

/**
 * Devoluciones / RMA (HU-107a). El operador registra y gestiona devoluciones de
 * un pedido desde el panel (RLS `order_returns_admin_all`). El reembolso de
 * dinero es HU-107b; aquí se cubre el workflow (motivo → estado) + reposición de
 * stock opcional. `db` se pasa por parámetro (RLS por tenant).
 */

export interface CreateReturnInput {
  order_id: number
  order_number: string
  reason?: string | null
  note?: string | null
}

/** Valida el payload de una devolución nueva (puro). */
export function validateReturn(input: Partial<CreateReturnInput>): string | null {
  if (!input.order_id || !Number.isInteger(input.order_id)) return 'Pedido inválido.'
  if (!input.order_number || !input.order_number.trim()) return 'Número de pedido requerido.'
  if (input.reason && input.reason.length > 500) return 'El motivo es demasiado largo.'
  return null
}

/** Crea una devolución en estado `requested`. RLS exige is_admin + tenant. */
export async function createReturn(db: Db, input: CreateReturnInput, tenantId: string): Promise<{ ok: boolean; id?: number; error?: string }> {
  const { data, error } = await db.from('order_returns').insert({
    tenant_id: tenantId,
    order_id: input.order_id,
    order_number: input.order_number.trim(),
    reason: input.reason?.trim() || null,
    note: input.note?.trim() || null,
    status: 'requested',
  }).select('id').single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, id: (data as { id: number }).id }
}

/** Devoluciones de un pedido, más recientes primero (historial, AC-3). */
export async function getReturnsForOrder(db: Db, orderId: number): Promise<OrderReturn[]> {
  const { data } = await db
    .from('order_returns')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  return (data ?? []) as OrderReturn[]
}

/** Lista devoluciones (opcionalmente por estado) para gestión. */
export async function listReturns(db: Db, status?: OrderReturn['status']): Promise<OrderReturn[]> {
  let q = db.from('order_returns').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data } = await q
  return (data ?? []) as OrderReturn[]
}

/**
 * Cambia el estado de una devolución (approve/reject). Marca `resolved_at` y,
 * si se aprobó con reposición, `restocked = true` (la reposición real de stock
 * la ejecuta la ruta con el cliente privilegiado, idempotente). Devuelve la fila.
 */
export async function setReturnStatus(
  db: Db,
  id: number,
  status: 'approved' | 'rejected',
  opts: { restocked?: boolean } = {},
): Promise<{ ok: boolean; error?: string; returnRow?: OrderReturn }> {
  const patch: ReturnUpdate = {
    status,
    resolved_at: new Date().toISOString(),
  }
  if (status === 'approved' && opts.restocked) patch.restocked = true
  const { data, error } = await db.from('order_returns').update(patch).eq('id', id).select().single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, returnRow: data as OrderReturn }
}
