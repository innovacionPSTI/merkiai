/**
 * queries/production.ts — Órdenes de producción (HU-405, E24).
 *
 * `yieldRatio` y `producedLotUnitCost` son **puros**. `completeProductionOrder`
 * materializa la transformación sobre el libro (HU-401): descuenta los componentes
 * de la receta (salidas) y crea stock del terminado (entrada) con el **costo del
 * lote**. Idempotente por `op_key` (reejecutar no duplica movimientos).
 */
import type { Db } from '../client'
import { recordMovement } from './stock-movements'
import { getItemCostMap } from './costing'
import { getBomByOutput, explodeComponents, type Bom, type BomComponent } from './bom'
import { toBase } from './uom'

export interface ProductionOrder {
  id: number
  tenant_id?: string
  output_stock_item_id: number
  bom_id: number | null
  location_id: number | null
  planned_qty: number
  produced_qty: number | null
  status: string
  notes: string | null
  completed_at: string | null
}

/* ─────────────────────────────── puros ────────────────────────────────────── */

/** Rendimiento = obtenido / planificado (0 si no hay plan). */
export function yieldRatio(planned: number, produced: number): number {
  if (!(planned > 0)) return 0
  return Math.round((produced / planned) * 1e6) / 1e6
}

/** Costo por unidad base del lote producido = costo total de componentes / base obtenida. */
export function producedLotUnitCost(totalComponentCost: number, producedBaseQty: number): number {
  if (!(producedBaseQty > 0)) return 0
  return Math.round((totalComponentCost / producedBaseQty) * 1e6) / 1e6
}

/* ─────────────────────────────── BD ───────────────────────────────────────── */

export async function listProductionOrders(db: Db, opts: { status?: string; limit?: number } = {}): Promise<ProductionOrder[]> {
  let q = db.from('production_orders').select('*').order('created_at', { ascending: false })
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as ProductionOrder[]
}

export async function createProductionOrder(
  db: Db,
  input: { tenant_id?: string; output_stock_item_id: number; bom_id?: number | null; location_id?: number | null; planned_qty: number; notes?: string | null },
): Promise<ProductionOrder> {
  const row = {
    tenant_id: input.tenant_id,
    output_stock_item_id: input.output_stock_item_id,
    bom_id: input.bom_id ?? null,
    location_id: input.location_id ?? null,
    planned_qty: input.planned_qty,
    notes: input.notes ?? null,
    status: 'draft',
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('production_orders').insert(row as any).select().single()
  if (error) throw error
  return data as unknown as ProductionOrder
}

export interface CompleteProductionResult {
  produced_qty: number
  yield_ratio: number
  output_unit_cost: number
  components_consumed: number
  cost_complete: boolean
}

/**
 * Completa una orden: por la cantidad `producedQty` (default = planificada) explota
 * la receta, descuenta los componentes (movimientos de salida) y crea stock del
 * terminado (entrada) con el costo del lote. `uomFactorOf` resuelve el factor a
 * unidad base de cada UoM; `outputUomFactor` el de la unidad del terminado.
 * Idempotente por `op_key = prod:<orderId>:…`.
 */
export async function completeProductionOrder(
  db: Db,
  orderId: number,
  tenantId: string,
  args: { producedQty?: number; uomFactorOf: (uomId: number | null) => number; outputUomFactor?: number },
): Promise<CompleteProductionResult> {
  const { data: o } = await db.from('production_orders').select('*').eq('id', orderId).maybeSingle()
  if (!o) throw new Error('[production] orden no encontrada')
  const order = o as unknown as ProductionOrder
  const producedQty = args.producedQty ?? order.planned_qty

  const bomRes = await getBomByOutput(db, order.output_stock_item_id)
  if (!bomRes) throw new Error('[production] el ítem de salida no tiene receta (BOM) activa')
  const bom: Bom = bomRes.bom
  const components: BomComponent[] = bomRes.components

  const exploded = explodeComponents(components, producedQty, bom.yield_qty)
  const componentIds = [...new Set(components.map((c) => c.component_stock_item_id))]
  const costMap = await getItemCostMap(db, componentIds)

  let totalComponentCost = 0
  let costComplete = true
  let consumed = 0
  for (const line of exploded) {
    const factor = args.uomFactorOf(line.uom_id)
    const base = toBase(line.qty, factor)
    const cpb = costMap[line.component_stock_item_id]
    if (cpb == null) costComplete = false
    else totalComponentCost += base * cpb
    await recordMovement(db, {
      tenant_id: tenantId,
      stock_item_id: line.component_stock_item_id,
      location_id: order.location_id,
      movement_type: 'production_consume',
      qty: line.qty,
      uom_id: line.uom_id,
      uom_factor: factor,
      ref_type: 'production',
      ref_id: String(orderId),
      op_key: `prod:${orderId}:consume:${line.component_stock_item_id}`,
      reason: 'Consumo de producción',
    })
    consumed++
  }

  const outFactor = args.outputUomFactor ?? 1
  const producedBase = toBase(producedQty, outFactor)
  const outputUnitCost = producedLotUnitCost(totalComponentCost, producedBase)
  await recordMovement(db, {
    tenant_id: tenantId,
    stock_item_id: order.output_stock_item_id,
    location_id: order.location_id,
    movement_type: 'production_output',
    qty: producedQty,
    uom_factor: outFactor,
    unit_cost: outputUnitCost,
    ref_type: 'production',
    ref_id: String(orderId),
    op_key: `prod:${orderId}:output`,
    reason: 'Salida de producción',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.from('production_orders').update({ status: 'completed', produced_qty: producedQty, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq('id', orderId)

  return {
    produced_qty: producedQty,
    yield_ratio: yieldRatio(order.planned_qty, producedQty),
    output_unit_cost: outputUnitCost,
    components_consumed: consumed,
    cost_complete: costComplete,
  }
}
