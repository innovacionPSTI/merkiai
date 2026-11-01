/**
 * queries/costing.ts — Costeo de ítems de inventario (HU-403, E24).
 *
 * `weightedAverageCost` es **puro**: calcula el costo **por unidad base** como
 * promedio ponderado de las **entradas con costo** (compras y salidas de
 * producción), pesadas por su cantidad en unidad base. El costo es un atributo
 * de los movimientos del libro (HU-401), **no** un asiento contable.
 *
 * El roll-up por receta/BOM (costo del terminado a partir de sus componentes)
 * se habilita cuando exista el BOM (HU-404); aquí queda el costo directo del ítem.
 */
import type { Db } from '../client'

export interface CostEntry {
  /** Cantidad del movimiento en unidad base, con signo (+entrada/−salida). */
  qty_base: number
  /** Costo por unidad base de ese movimiento (null si no lo lleva). */
  unit_cost: number | null
}

/**
 * Promedio ponderado del costo por unidad base. Considera solo **entradas**
 * (`qty_base > 0`) **con costo** (`unit_cost != null`). Devuelve `null` si no hay
 * entradas con costo (costo desconocido). Puro.
 */
export function weightedAverageCost(entries: CostEntry[]): number | null {
  let totalQty = 0
  let totalCost = 0
  for (const e of entries) {
    if (e.unit_cost == null) continue
    if (!(e.qty_base > 0)) continue
    totalQty += e.qty_base
    totalCost += e.qty_base * e.unit_cost
  }
  if (totalQty <= 0) return null
  return Math.round((totalCost / totalQty) * 1e6) / 1e6
}

/** Valor del inventario a costo: disponible (unidad base) × costo unitario base. */
export function inventoryValue(availableBase: number, unitCost: number | null): number {
  if (unitCost == null) return 0
  return Math.round(availableBase * unitCost * 100) / 100
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

/** Costo (promedio ponderado por unidad base) de un ítem desde el libro. */
export async function getItemCost(db: Db, stockItemId: number): Promise<number | null> {
  const { data } = await db
    .from('stock_movements')
    .select('qty_base, unit_cost')
    .eq('stock_item_id', stockItemId)
    .not('unit_cost', 'is', null)
  return weightedAverageCost((data ?? []) as unknown as CostEntry[])
}

/** Costo de varios ítems (mapa stock_item_id → costo por unidad base | null). */
export async function getItemCostMap(db: Db, stockItemIds: number[]): Promise<Record<number, number | null>> {
  const out: Record<number, number | null> = {}
  if (!stockItemIds.length) return out
  const { data } = await db
    .from('stock_movements')
    .select('stock_item_id, qty_base, unit_cost')
    .in('stock_item_id', stockItemIds)
    .not('unit_cost', 'is', null)
  const byItem = new Map<number, CostEntry[]>()
  for (const r of (data ?? []) as Array<{ stock_item_id: number; qty_base: number; unit_cost: number | null }>) {
    const list = byItem.get(r.stock_item_id) ?? []
    list.push({ qty_base: r.qty_base, unit_cost: r.unit_cost })
    byItem.set(r.stock_item_id, list)
  }
  for (const id of stockItemIds) out[id] = weightedAverageCost(byItem.get(id) ?? [])
  return out
}
