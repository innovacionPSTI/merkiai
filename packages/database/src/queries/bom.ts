/**
 * queries/bom.ts — Receta / Lista de materiales (HU-404, E24).
 *
 * `explodeComponents` y `bomUnitCost` son **puros** (testeables):
 *  - explotar: escala las cantidades de los componentes a la cantidad de salida
 *    pedida (proporcional al rendimiento `yield_qty`).
 *  - costo unitario: roll-up directo (un nivel) = costo de los componentes por
 *    unidad de salida. El multinivel se habilita con un resolver recursivo (los
 *    componentes que son a su vez productos con BOM) — follow-up.
 *
 * La **política de consumo** (`al_vender` | `al_producir`) decide *cuándo* se
 * descuentan los componentes; el motor de explosión es el mismo (generaliza los
 * bundles de HU-168, que son el caso `al_vender` de un nivel).
 */
import type { Db } from '../client'
import { normalizeQty } from './uom'

export const CONSUMPTION_POLICIES = ['al_vender', 'al_producir'] as const
export type ConsumptionPolicy = (typeof CONSUMPTION_POLICIES)[number]

export function isConsumptionPolicy(v: unknown): v is ConsumptionPolicy {
  return typeof v === 'string' && (CONSUMPTION_POLICIES as readonly string[]).includes(v)
}

export interface Bom {
  id: number
  tenant_id?: string
  output_stock_item_id: number
  name: string | null
  consumption_policy: ConsumptionPolicy
  yield_qty: number
  active: boolean
}

export interface BomComponent {
  id?: number
  tenant_id?: string
  bom_id?: number
  component_stock_item_id: number
  qty: number
  uom_id: number | null
  /** factor a unidad base de la UoM del componente (para costeo); opcional. */
  uom_factor?: number
}

/**
 * Explota la receta para producir `outputQty` unidades de salida. Devuelve la
 * cantidad requerida de cada componente (en su propia unidad), escalada por
 * `outputQty / yield_qty`. Puro.
 */
export function explodeComponents(
  components: BomComponent[],
  outputQty: number,
  yieldQty: number,
): Array<{ component_stock_item_id: number; qty: number; uom_id: number | null }> {
  const scale = yieldQty > 0 ? outputQty / yieldQty : 0
  return components.map((c) => ({
    component_stock_item_id: c.component_stock_item_id,
    qty: normalizeQty(c.qty * scale),
    uom_id: c.uom_id,
  }))
}

/**
 * Costo por **unidad de salida** (roll-up directo de un nivel). `costOf` devuelve
 * el costo por **unidad base** de cada componente (o null si se desconoce).
 * `complete=false` si algún componente tiene costo desconocido (el costo devuelto
 * suma solo los conocidos → es un piso).
 */
export function bomUnitCost(
  components: BomComponent[],
  yieldQty: number,
  costOf: (componentStockItemId: number) => number | null,
): { cost: number; complete: boolean } {
  let total = 0
  let complete = true
  for (const c of components) {
    const cpb = costOf(c.component_stock_item_id)
    if (cpb == null) { complete = false; continue }
    const base = c.qty * (c.uom_factor ?? 1)
    total += base * cpb
  }
  const cost = yieldQty > 0 ? normalizeQty(total / yieldQty) : 0
  return { cost, complete }
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

export async function getBomByOutput(db: Db, outputStockItemId: number): Promise<{ bom: Bom; components: BomComponent[] } | null> {
  const { data: b } = await db.from('boms').select('*').eq('output_stock_item_id', outputStockItemId).eq('active', true).maybeSingle()
  if (!b) return null
  const bom = b as unknown as Bom
  const { data: comps } = await db.from('bom_components').select('*').eq('bom_id', bom.id)
  return { bom, components: (comps ?? []) as unknown as BomComponent[] }
}

export async function listBoms(db: Db): Promise<Bom[]> {
  const { data, error } = await db.from('boms').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Bom[]
}

export interface CreateBomInput {
  tenant_id?: string
  output_stock_item_id: number
  name?: string | null
  consumption_policy?: ConsumptionPolicy
  yield_qty?: number
  components: Array<{ component_stock_item_id: number; qty: number; uom_id?: number | null }>
}

export async function createBom(db: Db, input: CreateBomInput): Promise<Bom> {
  const header = {
    tenant_id: input.tenant_id,
    output_stock_item_id: input.output_stock_item_id,
    name: input.name ?? null,
    consumption_policy: isConsumptionPolicy(input.consumption_policy) ? input.consumption_policy : 'al_vender',
    yield_qty: input.yield_qty && input.yield_qty > 0 ? input.yield_qty : 1,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: b, error } = await db.from('boms').insert(header as any).select().single()
  if (error || !b) throw error ?? new Error('[bom] no se creó la receta')
  const bom = b as unknown as Bom
  if (input.components.length) {
    const rows = input.components.map((c) => ({
      tenant_id: input.tenant_id,
      bom_id: bom.id,
      component_stock_item_id: c.component_stock_item_id,
      qty: c.qty,
      uom_id: c.uom_id ?? null,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: cErr } = await db.from('bom_components').insert(rows as any)
    if (cErr) throw cErr
  }
  return bom
}

export async function deleteBom(db: Db, id: number): Promise<void> {
  const { error } = await db.from('boms').delete().eq('id', id)
  if (error) throw error
}
