import type { Db } from '../client'

/**
 * Segmentos de clientes (HU-288 · E19 Club VIP). Agrupan clientes de forma
 * manual o por reglas sobre el histórico de pedidos. `db` se pasa por parámetro
 * (RLS por tenant / is_admin). La evaluación de reglas es pura y testeable.
 */

export interface SegmentRules {
  /** Nº mínimo de pedidos válidos (pago aprobado). */
  min_orders?: number
  /** Gasto total mínimo acumulado. */
  min_total?: number
  /** La última compra válida debe ser dentro de estos días. */
  within_days?: number
}

export interface CustomerSegment {
  id: number
  name: string
  type: 'manual' | 'rules'
  rules: SegmentRules
  created_at: string
  updated_at: string
  member_count?: number
}

/** Métricas por cliente derivadas de su histórico de pedidos. */
export interface CustomerStats {
  customer_id: string
  orders: number
  total: number
  /** ISO de la última compra válida, o null. */
  last_order_at: string | null
}

/** Evalúa si un cliente cumple las reglas del segmento. Pura. */
export function evaluateSegmentRules(stats: CustomerStats, rules: SegmentRules, now: Date = new Date()): boolean {
  if (rules.min_orders != null && stats.orders < rules.min_orders) return false
  if (rules.min_total != null && stats.total < rules.min_total) return false
  if (rules.within_days != null) {
    if (!stats.last_order_at) return false
    const ageDays = (now.getTime() - new Date(stats.last_order_at).getTime()) / 86_400_000
    if (ageDays > rules.within_days) return false
  }
  // Un segmento por reglas sin reglas no incluye a nadie (evita "todos").
  if (rules.min_orders == null && rules.min_total == null && rules.within_days == null) return false
  return true
}

/** Clientes que cumplen las reglas, a partir de sus métricas. Pura. */
export function computeSegmentMembers(stats: CustomerStats[], rules: SegmentRules, now: Date = new Date()): string[] {
  return stats.filter((s) => evaluateSegmentRules(s, rules, now)).map((s) => s.customer_id)
}

/** Agrega el histórico de pedidos a métricas por cliente (pago aprobado). Pura. */
export function aggregateCustomerStats(
  orders: Array<{ customer_id: string | null; total: number; created_at: string; payment_status: string | null }>,
): CustomerStats[] {
  const map = new Map<string, CustomerStats>()
  for (const o of orders) {
    if (!o.customer_id || o.payment_status !== 'approved') continue
    const e = map.get(o.customer_id) ?? { customer_id: o.customer_id, orders: 0, total: 0, last_order_at: null }
    e.orders += 1
    e.total += Number(o.total ?? 0)
    if (!e.last_order_at || o.created_at > e.last_order_at) e.last_order_at = o.created_at
    map.set(o.customer_id, e)
  }
  return [...map.values()]
}

export async function listSegments(db: Db): Promise<CustomerSegment[]> {
  const { data } = await db
    .from('customer_segments')
    .select('id, name, type, rules, created_at, updated_at, customer_segment_members(count)')
    .order('created_at', { ascending: false })
  return (data ?? []).map((s: any) => ({
    id: s.id, name: s.name, type: s.type, rules: (s.rules ?? {}) as SegmentRules,
    created_at: s.created_at, updated_at: s.updated_at,
    member_count: Array.isArray(s.customer_segment_members) ? (s.customer_segment_members[0]?.count ?? 0) : 0,
  }))
}

export async function getSegment(id: number, db: Db): Promise<CustomerSegment | null> {
  const { data } = await db
    .from('customer_segments')
    .select('id, name, type, rules, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return { ...(data as any), rules: ((data as any).rules ?? {}) as SegmentRules }
}

export async function createSegment(
  input: { name: string; type?: 'manual' | 'rules'; rules?: SegmentRules },
  db: Db,
  tenantId: string,
): Promise<CustomerSegment> {
  const name = (input.name ?? '').trim()
  if (!name) throw new Error('El nombre del segmento es obligatorio.')
  const { data, error } = await db
    .from('customer_segments')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ tenant_id: tenantId, name, type: input.type ?? 'manual', rules: (input.rules ?? {}) as any } as any)
    .select('id, name, type, rules, created_at, updated_at')
    .single()
  if (error) throw error
  return { ...(data as any), rules: ((data as any).rules ?? {}) as SegmentRules }
}

export async function updateSegment(
  id: number,
  patch: { name?: string; rules?: SegmentRules },
  db: Db,
): Promise<void> {
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name != null) upd.name = patch.name.trim()
  if (patch.rules != null) upd.rules = patch.rules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('customer_segments').update(upd as any).eq('id', id)
  if (error) throw error
}

export async function deleteSegment(id: number, db: Db): Promise<void> {
  const { error } = await db.from('customer_segments').delete().eq('id', id)
  if (error) throw error
}

export interface SegmentMember {
  customer_id: string
  name: string | null
  email: string
  added_at: string
}

export async function listSegmentMembers(segmentId: number, db: Db): Promise<SegmentMember[]> {
  const { data } = await db
    .from('customer_segment_members')
    .select('customer_id, added_at, customers!inner(name, email)')
    .eq('segment_id', segmentId)
    .order('added_at', { ascending: false })
  return (data ?? []).map((m: any) => {
    const c = Array.isArray(m.customers) ? m.customers[0] : m.customers
    return { customer_id: m.customer_id, name: c?.name ?? null, email: c?.email ?? '', added_at: m.added_at }
  })
}

/** Agrega clientes al segmento (idempotente). */
export async function addSegmentMembers(segmentId: number, customerIds: string[], db: Db, tenantId: string): Promise<void> {
  if (!customerIds.length) return
  const rows = customerIds.map((customer_id) => ({ tenant_id: tenantId, segment_id: segmentId, customer_id }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('customer_segment_members').upsert(rows as any, { onConflict: 'segment_id,customer_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function removeSegmentMember(segmentId: number, customerId: string, db: Db): Promise<void> {
  const { error } = await db.from('customer_segment_members').delete().eq('segment_id', segmentId).eq('customer_id', customerId)
  if (error) throw error
}

/**
 * Recalcula los miembros de un segmento por reglas (AC-3). Lee el histórico de
 * pedidos, agrega métricas, resuelve los clientes que cumplen y sincroniza la
 * membresía (inserta nuevos, elimina los que ya no cumplen; sin duplicar).
 * Devuelve el nº de miembros resultante.
 */
export async function recalcSegment(segmentId: number, db: Db, tenantId: string, now: Date = new Date()): Promise<number> {
  const seg = await getSegment(segmentId, db)
  if (!seg || seg.type !== 'rules') throw new Error('El segmento no es por reglas.')

  const { data: orders } = await db.from('orders').select('customer_id, total, created_at, payment_status')
  const stats = aggregateCustomerStats((orders ?? []) as any)
  const desired = new Set(computeSegmentMembers(stats, seg.rules, now))

  const { data: current } = await db.from('customer_segment_members').select('customer_id').eq('segment_id', segmentId)
  const currentSet = new Set((current ?? []).map((r: any) => r.customer_id as string))

  const toAdd = [...desired].filter((id) => !currentSet.has(id))
  const toRemove = [...currentSet].filter((id) => !desired.has(id))

  if (toAdd.length) await addSegmentMembers(segmentId, toAdd, db, tenantId)
  if (toRemove.length) {
    await db.from('customer_segment_members').delete().eq('segment_id', segmentId).in('customer_id', toRemove)
  }
  return desired.size
}
