/**
 * queries/stock-transfer.ts — Transferencias de inventario entre ubicaciones con
 * **ciclo de vida** (E18·HU-180 AC-3).
 *
 * Una transferencia es una cabecera (`stock_transfers`) con dos piernas en el
 * libro que ocurren en momentos distintos:
 *   - **despachar** (`createTransfer`): sale del origen (`transfer` out) → `in_transit`;
 *   - **recibir** (`receiveTransfer`): entra al destino (`transfer` in) → `received`;
 *   - **cancelar** (`cancelTransfer`): si está en tránsito, devuelve el stock al
 *     origen (`transfer` in en el origen) → `cancelled`.
 * Cada pierna es idempotente por `op_key` (`transfer:<id>:out|in|cancel`).
 *
 * `planTransferMovements` sigue siendo **puro** (las dos direcciones de un
 * traslado) y se mantiene para pruebas/uso general.
 */
import type { Db } from '../client'
import { recordMovement, getAvailable, type MovementDirection } from './stock-movements'
import { toBase } from './uom'

export type TransferStatus = 'draft' | 'in_transit' | 'received' | 'cancelled'

export interface StockTransfer {
  id: number
  tenant_id?: string
  stock_item_id: number
  from_location_id: number
  to_location_id: number
  qty: number
  uom_id: number | null
  status: TransferStatus
  note: string | null
  shipped_at: string | null
  received_at: string | null
}

export interface TransferLeg { direction: MovementDirection; location_id: number }

/** Las dos piernas de una transferencia (salida origen + entrada destino). Puro. */
export function planTransferMovements(fromLocationId: number, toLocationId: number): TransferLeg[] {
  return [
    { direction: 'out', location_id: fromLocationId },
    { direction: 'in', location_id: toLocationId },
  ]
}

export interface CreateTransferInput {
  tenant_id?: string
  stock_item_id: number
  from_location_id: number
  to_location_id: number
  qty: number
  uom_id?: number | null
  uom_factor?: number
  note?: string | null
}

/**
 * Despacha una transferencia: valida (origen≠destino, qty>0, disponible en origen),
 * crea la cabecera `in_transit` y anexa la **salida** del origen al libro.
 */
export async function createTransfer(db: Db, input: CreateTransferInput): Promise<StockTransfer> {
  if (input.from_location_id === input.to_location_id) throw new Error('El origen y el destino deben ser distintos')
  if (!(input.qty > 0)) throw new Error('La cantidad debe ser mayor a cero')

  const factor = input.uom_factor ?? 1
  const qtyBase = toBase(input.qty, factor)
  const available = await getAvailable(db, input.stock_item_id, input.from_location_id)
  if (qtyBase > available) throw new Error(`Disponible insuficiente en el origen (${available})`)

  const header = {
    tenant_id: input.tenant_id,
    stock_item_id: input.stock_item_id,
    from_location_id: input.from_location_id,
    to_location_id: input.to_location_id,
    qty: input.qty,
    uom_id: input.uom_id ?? null,
    status: 'in_transit' as TransferStatus,
    note: input.note?.trim() || null,
    shipped_at: new Date().toISOString(),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('stock_transfers').insert(header as any).select().single()
  if (error) throw error
  const t = data as unknown as StockTransfer

  await recordMovement(db, {
    tenant_id: input.tenant_id,
    stock_item_id: input.stock_item_id,
    location_id: input.from_location_id,
    movement_type: 'transfer',
    direction: 'out',
    qty: input.qty,
    uom_id: input.uom_id ?? null,
    uom_factor: factor,
    reason: 'Transferencia (despacho)',
    ref_type: 'transfer',
    ref_id: String(t.id),
    op_key: `transfer:${t.id}:out`,
  })
  return t
}

async function loadTransfer(db: Db, id: number): Promise<StockTransfer | null> {
  const { data } = await db.from('stock_transfers').select('*').eq('id', id).maybeSingle()
  return (data as unknown as StockTransfer) ?? null
}

/** Recibe una transferencia en tránsito: anexa la **entrada** al destino y marca `received`. */
export async function receiveTransfer(db: Db, id: number): Promise<StockTransfer> {
  const t = await loadTransfer(db, id)
  if (!t) throw new Error('Transferencia no encontrada')
  if (t.status !== 'in_transit') throw new Error(`La transferencia está en estado "${t.status}"`)

  await recordMovement(db, {
    tenant_id: t.tenant_id,
    stock_item_id: t.stock_item_id,
    location_id: t.to_location_id,
    movement_type: 'transfer',
    direction: 'in',
    qty: t.qty,
    uom_id: t.uom_id,
    reason: 'Transferencia (recepción)',
    ref_type: 'transfer',
    ref_id: String(t.id),
    op_key: `transfer:${t.id}:in`,
  })
  const { data, error } = await db
    .from('stock_transfers')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'received', received_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
    .eq('id', id).select().single()
  if (error) throw error
  return data as unknown as StockTransfer
}

/** Cancela una transferencia en tránsito: devuelve el stock al origen y marca `cancelled`. */
export async function cancelTransfer(db: Db, id: number): Promise<StockTransfer> {
  const t = await loadTransfer(db, id)
  if (!t) throw new Error('Transferencia no encontrada')
  if (t.status !== 'in_transit') throw new Error(`Solo se cancelan transferencias en tránsito (está "${t.status}")`)

  await recordMovement(db, {
    tenant_id: t.tenant_id,
    stock_item_id: t.stock_item_id,
    location_id: t.from_location_id,
    movement_type: 'transfer',
    direction: 'in',
    qty: t.qty,
    uom_id: t.uom_id,
    reason: 'Transferencia (cancelada, reingreso al origen)',
    ref_type: 'transfer',
    ref_id: String(t.id),
    op_key: `transfer:${t.id}:cancel`,
  })
  const { data, error } = await db
    .from('stock_transfers')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'cancelled', updated_at: new Date().toISOString() } as any)
    .eq('id', id).select().single()
  if (error) throw error
  return data as unknown as StockTransfer
}

export async function listTransfers(
  db: Db,
  opts: { status?: TransferStatus; stockItemId?: number; limit?: number } = {},
): Promise<StockTransfer[]> {
  let q = db.from('stock_transfers').select('*').order('created_at', { ascending: false })
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.stockItemId != null) q = q.eq('stock_item_id', opts.stockItemId)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as StockTransfer[]
}
