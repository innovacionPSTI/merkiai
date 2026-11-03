/**
 * queries/opening-stock.ts — Backfill del stock legacy al ledger (E18·HU-178 F3).
 *
 * Materializa el `product_variants.stock` actual de las variantes **enlazadas** a
 * un `stock_item` como **saldo de apertura** en el libro (movimiento `adjustment`
 * de entrada), para que el disponible del ledger arranque cuadrado con el stock
 * que hoy ve la tienda (AC-1/AC-2). **Idempotente por `op_key`** (`opening:<item>`):
 * re-ejecutar no duplica ni "actualiza" (la apertura es una foto única).
 *
 * `planOpeningMovements` es **puro**. `backfillOpeningStock` lee las variantes y
 * anexa los movimientos. No toca `product_variants.stock` (se conserva como
 * agregado legacy durante la transición).
 */
import type { Db } from '../client'
import { recordMovement } from './stock-movements'

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

export interface VariantStockLink { stock_item_id: number; stock: number; tenant_id?: string }
export interface OpeningMovement { stock_item_id: number; qty_base: number; tenant_id?: string }

/**
 * Agrega el stock legacy por `stock_item` (varias variantes pueden mapear al mismo
 * ítem). Solo emite apertura positiva; stock ≤ 0 no genera movimiento. Puro.
 */
export function planOpeningMovements(links: VariantStockLink[]): OpeningMovement[] {
  const agg = new Map<number, { qty: number; tenant_id?: string }>()
  for (const l of links) {
    if (l.stock_item_id == null || !(l.stock > 0)) continue
    const cur = agg.get(l.stock_item_id) ?? { qty: 0, tenant_id: l.tenant_id }
    cur.qty = round6(cur.qty + l.stock)
    agg.set(l.stock_item_id, cur)
  }
  return [...agg.entries()].map(([stock_item_id, v]) => ({ stock_item_id, qty_base: v.qty, tenant_id: v.tenant_id }))
}

/**
 * Siembra el saldo de apertura en el libro para las variantes enlazadas del tenant.
 * Idempotente. Devuelve cuántos movimientos nuevos se anexaron.
 */
export async function backfillOpeningStock(db: Db): Promise<{ applied: number; items: number }> {
  const { data } = await db
    .from('product_variants')
    .select('stock, stock_item_id, tenant_id')
    .not('stock_item_id', 'is', null)
  const links = ((data ?? []) as Array<{ stock: number | null; stock_item_id: number; tenant_id?: string }>)
    .map((r) => ({ stock_item_id: r.stock_item_id, stock: Number(r.stock ?? 0), tenant_id: r.tenant_id }))
  const plan = planOpeningMovements(links)

  let applied = 0
  for (const m of plan) {
    const res = await recordMovement(db, {
      tenant_id: m.tenant_id,
      stock_item_id: m.stock_item_id,
      movement_type: 'adjustment',
      direction: 'in',
      qty: m.qty_base,
      uom_factor: 1,
      reason: 'Saldo de apertura (backfill legacy)',
      ref_type: 'opening',
      ref_id: String(m.stock_item_id),
      op_key: `opening:${m.stock_item_id}`,
    })
    if (!res.deduped) applied += 1
  }
  return { applied, items: plan.length }
}
