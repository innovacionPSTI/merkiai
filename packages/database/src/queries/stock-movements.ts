/**
 * queries/stock-movements.ts — Libro de movimientos de inventario (HU-401, E24).
 *
 * `buildMovementRow` es **puro** (sin BD): resuelve la dirección del movimiento,
 * convierte a la unidad base y calcula la cantidad **con signo** (`qty_base`) que
 * el libro suma para proyectar el disponible. Las funciones de BD anexan al libro
 * (append-only, idempotente por `op_key`) y leen la proyección `stock_item_available`.
 */
import type { Db } from '../client'
import { toBase } from './uom'

export const MOVEMENT_TYPES = [
  'purchase', 'production_consume', 'production_output',
  'sale', 'waste', 'adjustment', 'transfer', 'sample', 'return',
] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]
export type MovementDirection = 'in' | 'out'

export function isMovementType(v: unknown): v is MovementType {
  return typeof v === 'string' && (MOVEMENT_TYPES as readonly string[]).includes(v)
}

/**
 * Dirección natural de cada tipo. `adjustment` y `transfer` NO la tienen (una
 * leg puede entrar o salir), así que el llamador debe especificarla → `null`.
 */
export function defaultDirection(type: MovementType): MovementDirection | null {
  switch (type) {
    case 'purchase':
    case 'production_output':
    case 'return':
      return 'in'
    case 'sale':
    case 'production_consume':
    case 'waste':
    case 'sample':
      return 'out'
    case 'adjustment':
    case 'transfer':
      return null
  }
}

export interface MovementInput {
  tenant_id?: string
  stock_item_id: number
  location_id?: number | null
  movement_type: MovementType
  direction?: MovementDirection          // requerido para adjustment/transfer
  qty: number                            // cantidad positiva (en la unidad dada)
  uom_id?: number | null
  uom_factor?: number                    // factor a unidad base (default 1)
  reason?: string | null
  ref_type?: string | null
  ref_id?: string | null
  op_key?: string | null
  created_by?: string | null
  /** Costo por **unidad base** (solo entradas con costo: compra/producción). */
  unit_cost?: number | null
}

export interface MovementRow {
  tenant_id?: string
  stock_item_id: number
  location_id: number | null
  movement_type: MovementType
  direction: MovementDirection
  qty: number
  uom_id: number | null
  qty_base: number
  reason: string | null
  ref_type: string | null
  ref_id: string | null
  op_key: string | null
  created_by: string | null
  unit_cost: number | null
}

/**
 * Construye la fila a insertar (pura). Lanza si falta la dirección en un tipo que
 * la exige, o si la cantidad no es positiva.
 */
export function buildMovementRow(input: MovementInput): MovementRow {
  if (!isMovementType(input.movement_type)) throw new Error(`[ledger] tipo inválido: ${input.movement_type}`)
  if (!(input.qty > 0)) throw new Error('[ledger] qty debe ser > 0')
  const direction = input.direction ?? defaultDirection(input.movement_type)
  if (!direction) throw new Error(`[ledger] ${input.movement_type} requiere direction ('in'|'out')`)
  const base = toBase(input.qty, input.uom_factor ?? 1)
  const qty_base = direction === 'in' ? base : -base
  return {
    tenant_id: input.tenant_id,
    stock_item_id: input.stock_item_id,
    location_id: input.location_id ?? null,
    movement_type: input.movement_type,
    direction,
    qty: input.qty,
    uom_id: input.uom_id ?? null,
    qty_base,
    reason: input.reason ?? null,
    ref_type: input.ref_type ?? null,
    ref_id: input.ref_id ?? null,
    op_key: input.op_key ?? null,
    created_by: input.created_by ?? null,
    unit_cost: input.unit_cost ?? null,
  }
}

/* ───────────────────────────── BD (append-only) ───────────────────────────── */

/**
 * Anexa un movimiento al libro. **Idempotente** por `op_key`: si ya existe uno
 * con esa clave (por tenant), devuelve el existente sin duplicar.
 */
export async function recordMovement(db: Db, input: MovementInput): Promise<{ id: number; deduped: boolean }> {
  const row = buildMovementRow(input)
  if (row.op_key) {
    const { data: existing } = await db
      .from('stock_movements').select('id').eq('op_key', row.op_key).maybeSingle()
    if (existing?.id) return { id: existing.id as number, deduped: true }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('stock_movements').insert(row as any).select('id').single()
  if (error) throw error
  return { id: (data as { id: number }).id, deduped: false }
}

export interface MovementRecord extends MovementRow { id: number; created_at: string }

/** Kardex: historial de movimientos (por ítem y/o referencia). */
export async function listMovements(
  db: Db,
  opts: { stockItemId?: number; refType?: string; refId?: string; limit?: number } = {},
): Promise<MovementRecord[]> {
  let q = db.from('stock_movements').select('*').order('created_at', { ascending: false })
  if (opts.stockItemId != null) q = q.eq('stock_item_id', opts.stockItemId)
  if (opts.refType) q = q.eq('ref_type', opts.refType)
  if (opts.refId) q = q.eq('ref_id', opts.refId)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as MovementRecord[]
}

/** Disponible proyectado de un ítem (suma del libro); opcionalmente por ubicación. */
export async function getAvailable(db: Db, stockItemId: number, locationId?: number | null): Promise<number> {
  let q = db.from('stock_item_available').select('available, location_id').eq('stock_item_id', stockItemId)
  if (locationId != null) q = q.eq('location_id', locationId)
  const { data } = await q
  const rows = (data ?? []) as Array<{ available: number | string }>
  return rows.reduce((s, r) => s + Number(r.available ?? 0), 0)
}

/** Disponible de varios ítems (agregado por ítem, todas las ubicaciones). */
export async function getAvailableMap(db: Db, stockItemIds: number[]): Promise<Record<number, number>> {
  if (!stockItemIds.length) return {}
  const { data } = await db
    .from('stock_item_available').select('stock_item_id, available').in('stock_item_id', stockItemIds)
  const out: Record<number, number> = {}
  for (const r of (data ?? []) as Array<{ stock_item_id: number; available: number | string }>) {
    out[r.stock_item_id] = (out[r.stock_item_id] ?? 0) + Number(r.available ?? 0)
  }
  return out
}
