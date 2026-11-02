/**
 * queries/modifiers.ts — Modificadores / opciones de producto (HU-406, E24).
 *
 * `validateSelection`, `selectionPriceDelta` y `selectionConsumption` son **puros**
 * (sin BD): validan una selección contra las reglas del grupo, calculan el ajuste
 * de precio y la lista de inventario a consumir. El descuento real se aplica en la
 * venta/POS anexando los movimientos al libro (HU-401).
 */
import type { Db } from '../client'

export interface ModifierGroup {
  id: number
  tenant_id?: string
  product_id: number
  name: string
  min_select: number
  max_select: number   // 0 = sin tope
  required: boolean
  active: boolean
  order_index: number
}

export interface ModifierOption {
  id: number
  tenant_id?: string
  group_id: number
  name: string
  price_delta: number
  consume_stock_item_id: number | null
  consume_qty: number | null
  consume_uom_id: number | null
  active: boolean
  order_index: number
}

/** Valida la selección de un grupo. Devuelve `null` si es válida, o un mensaje. */
export function validateSelection(group: Pick<ModifierGroup, 'name' | 'min_select' | 'max_select' | 'required'>, selectedCount: number): string | null {
  if (group.required && selectedCount < 1) return `Selecciona una opción de "${group.name}"`
  if (selectedCount < group.min_select) return `"${group.name}" requiere al menos ${group.min_select}`
  if (group.max_select > 0 && selectedCount > group.max_select) return `"${group.name}" permite máximo ${group.max_select}`
  return null
}

/** Suma de los ajustes de precio de las opciones seleccionadas. */
export function selectionPriceDelta(options: Pick<ModifierOption, 'id' | 'price_delta'>[], selectedIds: number[]): number {
  const set = new Set(selectedIds)
  const total = options.filter((o) => set.has(o.id)).reduce((s, o) => s + o.price_delta, 0)
  return Math.round(total * 100) / 100
}

/** Inventario a consumir por las opciones seleccionadas (escalado por `qty` del ítem). */
export function selectionConsumption(
  options: ModifierOption[],
  selectedIds: number[],
  qty = 1,
): Array<{ stock_item_id: number; qty: number; uom_id: number | null }> {
  const set = new Set(selectedIds)
  const out: Array<{ stock_item_id: number; qty: number; uom_id: number | null }> = []
  for (const o of options) {
    if (!set.has(o.id)) continue
    if (o.consume_stock_item_id == null || o.consume_qty == null) continue
    out.push({ stock_item_id: o.consume_stock_item_id, qty: Math.round(o.consume_qty * qty * 1e6) / 1e6, uom_id: o.consume_uom_id })
  }
  return out
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

export async function getProductModifiers(db: Db, productId: number): Promise<Array<ModifierGroup & { options: ModifierOption[] }>> {
  const { data: groups } = await db.from('modifier_groups').select('*').eq('product_id', productId).order('order_index')
  const gs = (groups ?? []) as unknown as ModifierGroup[]
  if (!gs.length) return []
  const { data: opts } = await db.from('modifier_options').select('*').in('group_id', gs.map((g) => g.id)).order('order_index')
  const options = (opts ?? []) as unknown as ModifierOption[]
  return gs.map((g) => ({ ...g, options: options.filter((o) => o.group_id === g.id) }))
}

export async function createModifierGroup(
  db: Db,
  input: { tenant_id?: string; product_id: number; name: string; min_select?: number; max_select?: number; required?: boolean; order_index?: number },
): Promise<ModifierGroup> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('modifier_groups').insert({ ...input, name: input.name.trim() } as any).select().single()
  if (error) throw error
  return data as unknown as ModifierGroup
}

export async function createModifierOption(
  db: Db,
  input: { tenant_id?: string; group_id: number; name: string; price_delta?: number; consume_stock_item_id?: number | null; consume_qty?: number | null; consume_uom_id?: number | null; order_index?: number },
): Promise<ModifierOption> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('modifier_options').insert({ ...input, name: input.name.trim() } as any).select().single()
  if (error) throw error
  return data as unknown as ModifierOption
}
