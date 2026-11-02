/**
 * queries/stock-items.ts — Capa de datos de unidades de medida e ítems de
 * inventario (HU-400, E24). CRUD tenant-scoped; el `tenant_id` se fija en las
 * escrituras (el service-role no pasa por RLS). Las cantidades y factores son
 * decimales (numeric en la BD → number en TS).
 */
import type { Db } from '../client'
import type { Uom, StockItem } from './uom'
import { normalizeStockItemInput } from './uom'

/* ─────────────────────────── Unidades de medida ───────────────────────────── */

export async function listUoms(db: Db): Promise<Uom[]> {
  const { data, error } = await db.from('uoms').select('*').order('dimension').order('to_base_factor')
  if (error) throw error
  return (data ?? []) as unknown as Uom[]
}

export async function createUom(
  db: Db,
  input: { tenant_id?: string; code: string; name: string; dimension?: string; to_base_factor?: number },
): Promise<Uom> {
  const row = {
    tenant_id: input.tenant_id,
    code: input.code.trim(),
    name: input.name.trim(),
    dimension: input.dimension ?? 'count',
    to_base_factor: input.to_base_factor ?? 1,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('uoms').insert(row as any).select().single()
  if (error) throw error
  return data as unknown as Uom
}

/* ───────────────────────────── Ítems de inventario ────────────────────────── */

export async function listStockItems(
  db: Db,
  opts: { itemClass?: string; activeOnly?: boolean } = {},
): Promise<StockItem[]> {
  let q = db.from('stock_items').select('*').order('name')
  if (opts.itemClass) q = q.eq('item_class', opts.itemClass)
  if (opts.activeOnly) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as StockItem[]
}

export async function getStockItem(db: Db, key: string): Promise<StockItem | null> {
  const { data } = await db.from('stock_items').select('*').eq('key', key).maybeSingle()
  return (data as unknown as StockItem) ?? null
}

export async function countStockItems(db: Db): Promise<number> {
  const { count } = await db.from('stock_items').select('id', { count: 'exact', head: true })
  return count ?? 0
}

export async function createStockItem(
  db: Db,
  input: { tenant_id?: string; key?: string; name?: string; item_class?: string; uom_id?: number | null; sellable?: boolean; active?: boolean },
): Promise<StockItem> {
  const norm = normalizeStockItemInput(input)
  if (!norm) throw new Error('[stock-items] nombre/clave requeridos')
  const row = { tenant_id: input.tenant_id, ...norm }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('stock_items').insert(row as any).select().single()
  if (error) throw error
  return data as unknown as StockItem
}

export async function updateStockItem(
  db: Db,
  key: string,
  patch: Partial<{ name: string; item_class: string; uom_id: number | null; sellable: boolean; active: boolean }>,
): Promise<StockItem> {
  const { data, error } = await db
    .from('stock_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq('key', key)
    .select()
    .single()
  if (error) throw error
  return data as unknown as StockItem
}

export async function updateStockItemById(
  db: Db,
  id: number,
  patch: Partial<{ name: string; item_class: string; uom_id: number | null; sellable: boolean; active: boolean }>,
): Promise<StockItem> {
  const { data, error } = await db
    .from('stock_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...patch, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as StockItem
}

export async function deleteStockItem(db: Db, key: string): Promise<void> {
  const { error } = await db.from('stock_items').delete().eq('key', key)
  if (error) throw error
}
