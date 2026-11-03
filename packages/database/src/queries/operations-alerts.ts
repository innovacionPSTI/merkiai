/**
 * queries/operations-alerts.ts — Motor de alertas de operaciones (HU-409 F2a, E24).
 *
 * `evaluateInventoryAlerts` es **puro** (sin BD): dado el catálogo con su punto de
 * reorden y el disponible proyectado del ledger, emite alertas de **bajo mínimo**
 * por ítem (generaliza HU-106, que operaba sobre `product_variants.stock`). Sin
 * `reorder_point`, el ítem no alerta (cero regresión). La severidad distingue
 * "agotado" (disponible ≤ 0) de "bajo" (0 < disponible ≤ reorder_point).
 *
 * Diseñado para crecer: el tipo `OperationsAlert` es abierto (`kind`) para sumar
 * merma fuera de rango, por recibir, descuadre de caja y fallo de sync POS cuando
 * esas superficies existan (E25/integraciones).
 */
import type { Db } from '../client'
import { listStockItems } from './stock-items'
import { getAvailableMap } from './stock-movements'

export type AlertSeverity = 'warning' | 'critical'
export type AlertKind = 'low_stock' | 'out_of_stock'

export interface OperationsAlert {
  kind: AlertKind
  severity: AlertSeverity
  stock_item_id: number
  key: string
  name: string
  available: number
  reorder_point: number
}

interface ItemLite {
  id: number
  key: string
  name: string
  reorder_point?: number | null
  active?: boolean
}

/** Emite alertas de bajo mínimo/agotado para ítems con `reorder_point` definido. */
export function evaluateInventoryAlerts(
  items: ItemLite[],
  availableMap: Record<number, number>,
): OperationsAlert[] {
  const out: OperationsAlert[] = []
  for (const it of items) {
    if (it.active === false) continue
    const rp = it.reorder_point
    if (rp == null || !(rp >= 0)) continue
    const available = availableMap[it.id] ?? 0
    if (available > rp) continue
    out.push({
      kind: available <= 0 ? 'out_of_stock' : 'low_stock',
      severity: available <= 0 ? 'critical' : 'warning',
      stock_item_id: it.id,
      key: it.key,
      name: it.name,
      available,
      reorder_point: rp,
    })
  }
  // Primero lo más crítico; dentro, el más "hundido" bajo su punto de reorden.
  const rank = (a: OperationsAlert) => (a.severity === 'critical' ? 0 : 1)
  return out.sort((a, b) => rank(a) - rank(b) || (a.available - a.reorder_point) - (b.available - b.reorder_point))
}

/** Alertas de inventario del tenant (bajo mínimo/agotado) sobre el ledger. */
export async function inventoryAlerts(db: Db): Promise<OperationsAlert[]> {
  const items = await listStockItems(db, { activeOnly: true })
  const withRp = items.filter((i) => i.reorder_point != null)
  if (!withRp.length) return []
  const availableMap = await getAvailableMap(db, withRp.map((i) => i.id))
  return evaluateInventoryAlerts(
    withRp.map((i) => ({ id: i.id, key: i.key, name: i.name, reorder_point: i.reorder_point, active: i.active })),
    availableMap,
  )
}

/* ── HU-183 · Alertas por ubicación ─────────────────────────────────────────── */

export interface LocationAlert extends OperationsAlert {
  location_id: number | null
}

/**
 * Alertas de bajo mínimo **por (ítem, ubicación)** (HU-183): compara el disponible
 * de cada ubicación contra el punto de reorden del ítem (interpretación v1: cada
 * sede debe mantener al menos ese mínimo). Puro.
 */
export function evaluateInventoryAlertsByLocation(
  items: ItemLite[],
  byLocation: Record<number, Array<{ location_id: number | null; available: number }>>,
): LocationAlert[] {
  const out: LocationAlert[] = []
  for (const it of items) {
    if (it.active === false) continue
    const rp = it.reorder_point
    if (rp == null || !(rp >= 0)) continue
    for (const loc of byLocation[it.id] ?? []) {
      if (loc.available > rp) continue
      out.push({
        kind: loc.available <= 0 ? 'out_of_stock' : 'low_stock',
        severity: loc.available <= 0 ? 'critical' : 'warning',
        stock_item_id: it.id, key: it.key, name: it.name,
        available: loc.available, reorder_point: rp, location_id: loc.location_id,
      })
    }
  }
  const rank = (a: LocationAlert) => (a.severity === 'critical' ? 0 : 1)
  return out.sort((a, b) => rank(a) - rank(b) || (a.available - a.reorder_point) - (b.available - b.reorder_point))
}

/** Alertas de bajo mínimo por ubicación del tenant (sobre `stock_item_available`). */
export async function inventoryAlertsByLocation(db: Db): Promise<LocationAlert[]> {
  const items = (await listStockItems(db, { activeOnly: true })).filter((i) => i.reorder_point != null)
  if (!items.length) return []
  const { data } = await db
    .from('stock_item_available').select('stock_item_id, location_id, available').in('stock_item_id', items.map((i) => i.id))
  const byLocation: Record<number, Array<{ location_id: number | null; available: number }>> = {}
  for (const r of (data ?? []) as Array<{ stock_item_id: number; location_id: number | null; available: number | string }>) {
    ;(byLocation[r.stock_item_id] ??= []).push({ location_id: r.location_id, available: Number(r.available ?? 0) })
  }
  return evaluateInventoryAlertsByLocation(
    items.map((i) => ({ id: i.id, key: i.key, name: i.name, reorder_point: i.reorder_point, active: i.active })),
    byLocation,
  )
}
