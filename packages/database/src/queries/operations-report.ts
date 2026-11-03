/**
 * queries/operations-report.ts — Reportes/tableros de operaciones (HU-409, E24).
 *
 * `summarizeInventory` y `summarizeMovements` son **puros** (sin BD): agregan las
 * proyecciones del ledger (disponible + costo) y el libro de movimientos en
 * resúmenes para el tablero. Las funciones de BD cargan los datos reusando las
 * queries existentes (stock items, disponible, costo, movimientos) y delegan en
 * los helpers puros. Alertas (AC-3) se tratan en una fase posterior.
 */
import type { Db } from '../client'
import { listStockItems } from './stock-items'
import { getAvailableMap } from './stock-movements'
import { getItemCostMap } from './costing'
import { inventoryValue } from './costing'
import { objectsToCsv } from '../lib/product-import'

/* ───────────────────────────── Tipos ──────────────────────────────────────── */

export interface InventoryClassStat {
  item_class: string
  count: number
  value: number   // valor a costo (Σ disponible_base × costo_unitario)
}

export interface InventorySummary {
  totalItems: number
  sellableItems: number
  totalValue: number
  withoutCost: number           // ítems con disponible pero sin costo conocido
  byClass: InventoryClassStat[]
}

export interface MovementLite {
  movement_type: string
  qty_base: number | string
  unit_cost?: number | null
  created_at?: string
}

export interface MovementTypeStat {
  movement_type: string
  count: number
  qtyIn: number     // Σ qty_base de entradas (qty_base > 0)
  qtyOut: number    // Σ |qty_base| de salidas (qty_base < 0)
  valueIn: number   // Σ unit_cost × qty_base de entradas con costo
}

export interface MovementsSummary {
  from: string | null
  total: number
  byType: MovementTypeStat[]
}

/* ───────────────────────────── Puros ──────────────────────────────────────── */

interface ItemLite { id: number; item_class: string; sellable: boolean }

/** Resume existencias por clase y su valor a costo (AC-1/AC-2). */
export function summarizeInventory(
  items: ItemLite[],
  availableMap: Record<number, number>,
  costMap: Record<number, number | null>,
): InventorySummary {
  const classes = new Map<string, InventoryClassStat>()
  let totalValue = 0
  let sellableItems = 0
  let withoutCost = 0

  for (const it of items) {
    const available = availableMap[it.id] ?? 0
    const cost = costMap[it.id] ?? null
    const value = inventoryValue(available, cost)
    totalValue += value
    if (it.sellable) sellableItems += 1
    if (available !== 0 && cost == null) withoutCost += 1

    const stat = classes.get(it.item_class) ?? { item_class: it.item_class, count: 0, value: 0 }
    stat.count += 1
    stat.value += value
    classes.set(it.item_class, stat)
  }

  return {
    totalItems: items.length,
    sellableItems,
    totalValue: Math.round(totalValue * 100) / 100,
    withoutCost,
    byClass: [...classes.values()]
      .map((s) => ({ ...s, value: Math.round(s.value * 100) / 100 }))
      .sort((a, b) => b.value - a.value),
  }
}

/** Resume el libro de movimientos por tipo (conteo, entradas/salidas, valor). */
export function summarizeMovements(movs: MovementLite[], from: string | null = null): MovementsSummary {
  const types = new Map<string, MovementTypeStat>()
  for (const m of movs) {
    const qb = Number(m.qty_base ?? 0)
    const stat = types.get(m.movement_type) ?? { movement_type: m.movement_type, count: 0, qtyIn: 0, qtyOut: 0, valueIn: 0 }
    stat.count += 1
    if (qb >= 0) {
      stat.qtyIn += qb
      if (m.unit_cost != null) stat.valueIn += m.unit_cost * qb
    } else {
      stat.qtyOut += -qb
    }
    types.set(m.movement_type, stat)
  }
  const round = (n: number) => Math.round(n * 1e6) / 1e6
  return {
    from,
    total: movs.length,
    byType: [...types.values()]
      .map((s) => ({ ...s, qtyIn: round(s.qtyIn), qtyOut: round(s.qtyOut), valueIn: Math.round(s.valueIn * 100) / 100 }))
      .sort((a, b) => b.count - a.count),
  }
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

/** Resumen de inventario a partir del catálogo activo + proyecciones del ledger. */
export async function inventorySummary(db: Db): Promise<InventorySummary> {
  const items = await listStockItems(db, { activeOnly: true })
  const ids = items.map((i) => i.id)
  const [availableMap, costMap] = await Promise.all([getAvailableMap(db, ids), getItemCostMap(db, ids)])
  return summarizeInventory(
    items.map((i) => ({ id: i.id, item_class: i.item_class, sellable: i.sellable })),
    availableMap,
    costMap,
  )
}

/** Resumen de movimientos del libro desde una fecha (inclusive). */
export async function movementsSummarySince(db: Db, fromISO: string): Promise<MovementsSummary> {
  const { data, error } = await db
    .from('stock_movements')
    .select('movement_type, qty_base, unit_cost, created_at')
    .gte('created_at', fromISO)
  if (error) throw error
  return summarizeMovements((data ?? []) as unknown as MovementLite[], fromISO)
}

/* ───────────────────────────── Exportes CSV (HU-409 AC-1) ──────────────────── */

export interface InventoryValuationRow {
  key: string
  name: string
  item_class: string
  available: number
  unit_cost: number | null
  value: number
}

/** Valorización por ítem: disponible × costo unitario (a partir del ledger). */
export async function inventoryValuationRows(db: Db): Promise<InventoryValuationRow[]> {
  const items = await listStockItems(db, { activeOnly: true })
  const ids = items.map((i) => i.id)
  const [availableMap, costMap] = await Promise.all([getAvailableMap(db, ids), getItemCostMap(db, ids)])
  return items
    .map((i) => {
      const available = availableMap[i.id] ?? 0
      const unit_cost = costMap[i.id] ?? null
      return { key: i.key, name: i.name, item_class: i.item_class, available, unit_cost, value: inventoryValue(available, unit_cost) }
    })
    .sort((a, b) => b.value - a.value)
}

/** CSV de valorización de inventario (puro). */
export function inventoryValuationToCsv(rows: InventoryValuationRow[]): string {
  const headers = ['clave', 'nombre', 'clase', 'disponible', 'costo_unitario', 'valor']
  return objectsToCsv(headers, rows.map((r) => ({
    clave: r.key, nombre: r.name, clase: r.item_class,
    disponible: r.available, costo_unitario: r.unit_cost ?? '',
    valor: Math.round(r.value * 100) / 100,
  })))
}

/** CSV del resumen de movimientos por tipo (puro). */
export function movementsSummaryToCsv(summary: MovementsSummary): string {
  const headers = ['tipo', 'movimientos', 'entradas', 'salidas', 'valor_entradas']
  return objectsToCsv(headers, summary.byType.map((t) => ({
    tipo: t.movement_type, movimientos: t.count, entradas: t.qtyIn, salidas: t.qtyOut, valor_entradas: t.valueIn,
  })))
}

export interface KardexRow {
  created_at: string
  movement_type: string
  direction: string
  qty: number | string
  uom_id?: number | null
  reason?: string | null
  ref_type?: string | null
  ref_id?: string | null
}

/** CSV del kardex (historial de movimientos) de un ítem (puro). */
export function kardexToCsv(rows: KardexRow[], uomCode: Record<number, string> = {}): string {
  const headers = ['fecha', 'tipo', 'direccion', 'cantidad', 'unidad', 'motivo', 'referencia']
  return objectsToCsv(headers, rows.map((r) => ({
    fecha: r.created_at,
    tipo: r.movement_type,
    direccion: r.direction,
    cantidad: Number(r.qty),
    unidad: r.uom_id != null ? (uomCode[r.uom_id] ?? '') : '',
    motivo: r.reason ?? '',
    referencia: r.ref_type ? `${r.ref_type} ${r.ref_id ?? ''}`.trim() : '',
  })))
}
