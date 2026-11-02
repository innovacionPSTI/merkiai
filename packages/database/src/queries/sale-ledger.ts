/**
 * queries/sale-ledger.ts — Descuento de la venta al libro de inventario (E18·HU-178).
 *
 * Hace del descuento de stock una **proyección del ledger**: cuando una variante
 * del catálogo está enlazada a un `stock_item` (`product_variants.stock_item_id`),
 * la venta anexa un movimiento `sale` (salida) al libro; si el terminado es la
 * salida de una receta con política `al_vender`, consume sus **componentes** en
 * vez del terminado. Las variantes **no** enlazadas siguen el descuento legacy
 * sobre `product_variants.stock` (ver `lib/stock.ts`) → cero regresión.
 *
 * `planSaleMovements` es **puro**. `applyLedgerSaleForOrder`/`reverseLedgerSaleForOrder`
 * anexan al libro de forma **idempotente** (por `op_key`), por lo que toleran
 * reintentos de webhook. Esta capa NO decide cuándo se llama (eso lo hará el
 * cableado del checkout, Fase 2, detrás de flag).
 */
import type { Db } from '../client'
import { recordMovement } from './stock-movements'
import { getBomByOutput } from './bom'
import { listUoms } from './stock-items'

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

export interface SaleLine { variant_id: number; qty: number }

/** Consumo de inventario resuelto para una variante (en unidad base por unidad vendida). */
export interface VariantConsumption {
  variant_id: number
  /** Terminado a descontar directamente (stocked / al_producir). */
  finished_stock_item_id?: number | null
  /** Componentes a consumir al vender (al_vender), en unidad base por 1 unidad vendida. */
  components?: Array<{ stock_item_id: number; qty_base: number }>
}

export interface SaleMovementIntent { stock_item_id: number; qty_base: number }

/**
 * Plan de salidas de inventario que genera una venta (puro). Agrega por ítem.
 * Variantes sin consumo resuelto se omiten (catálogo-solo → descuento legacy).
 */
export function planSaleMovements(lines: SaleLine[], consumptions: VariantConsumption[]): SaleMovementIntent[] {
  const byVariant = new Map<number, VariantConsumption>()
  for (const c of consumptions) byVariant.set(c.variant_id, c)

  const agg = new Map<number, number>()
  const add = (stockItemId: number, qtyBase: number) => {
    if (!(qtyBase > 0)) return
    agg.set(stockItemId, round6((agg.get(stockItemId) ?? 0) + qtyBase))
  }

  for (const line of lines) {
    if (!line.variant_id || !(line.qty > 0)) continue
    const c = byVariant.get(line.variant_id)
    if (!c) continue
    if (c.components && c.components.length) {
      for (const comp of c.components) add(comp.stock_item_id, comp.qty_base * line.qty)
    } else if (c.finished_stock_item_id != null) {
      add(c.finished_stock_item_id, line.qty)
    }
  }

  return [...agg.entries()].map(([stock_item_id, qty_base]) => ({ stock_item_id, qty_base }))
}

/* ───────────────────────────── BD ─────────────────────────────────────────── */

/**
 * Resuelve, para cada variante, su consumo de inventario: terminado directo o
 * (si es salida de un BOM `al_vender`) sus componentes en unidad base por unidad.
 * Variantes sin `stock_item_id` quedan fuera (sin consumo de ledger).
 */
export async function resolveVariantConsumptions(db: Db, variantIds: number[]): Promise<VariantConsumption[]> {
  if (!variantIds.length) return []
  const { data } = await db.from('product_variants').select('id, stock_item_id').in('id', variantIds)
  const rows = (data ?? []) as Array<{ id: number; stock_item_id: number | null }>
  const linked = rows.filter((r) => r.stock_item_id != null)
  if (!linked.length) return []

  const uoms = await listUoms(db)
  const uomFactor = new Map(uoms.map((u) => [u.id, u.to_base_factor]))

  const out: VariantConsumption[] = []
  for (const r of linked) {
    const sid = r.stock_item_id as number
    const bom = await getBomByOutput(db, sid)
    if (bom && bom.bom.consumption_policy === 'al_vender') {
      const yieldQty = bom.bom.yield_qty > 0 ? bom.bom.yield_qty : 1
      const components = bom.components.map((c) => ({
        stock_item_id: c.component_stock_item_id,
        qty_base: round6((c.qty * (c.uom_id != null ? (uomFactor.get(c.uom_id) ?? 1) : 1)) / yieldQty),
      }))
      out.push({ variant_id: r.id, components })
    } else {
      out.push({ variant_id: r.id, finished_stock_item_id: sid })
    }
  }
  return out
}

async function loadOrder(db: Db, orderNumber: string): Promise<{ tenant_id: string; items: SaleLine[] } | null> {
  const { data } = await db.from('orders').select('tenant_id, items').eq('order_number', orderNumber).maybeSingle()
  if (!data) return null
  const items = ((data as { items?: unknown }).items ?? []) as Array<{ variant_id?: number; qty?: number }>
  return {
    tenant_id: (data as { tenant_id: string }).tenant_id,
    items: items.filter((it) => it.variant_id && it.qty).map((it) => ({ variant_id: it.variant_id as number, qty: it.qty as number })),
  }
}

/**
 * Anexa al libro las salidas `sale` de un pedido (idempotente por `op_key`).
 * Devuelve el nº de movimientos anexados (nuevos). Solo afecta a las variantes
 * enlazadas a un `stock_item`. NO toca `product_variants.stock` (eso es legacy).
 */
export async function applyLedgerSaleForOrder(db: Db, orderNumber: string): Promise<number> {
  const order = await loadOrder(db, orderNumber)
  if (!order) return 0
  const consumptions = await resolveVariantConsumptions(db, order.items.map((i) => i.variant_id))
  const plan = planSaleMovements(order.items, consumptions)
  let applied = 0
  for (const m of plan) {
    const res = await recordMovement(db, {
      tenant_id: order.tenant_id,
      stock_item_id: m.stock_item_id,
      movement_type: 'sale',
      qty: m.qty_base,
      uom_factor: 1,
      reason: 'Venta',
      ref_type: 'order',
      ref_id: orderNumber,
      op_key: `sale:${orderNumber}:${m.stock_item_id}`,
    })
    if (!res.deduped) applied += 1
  }
  return applied
}

/**
 * Revierte las salidas de una venta (devolución al libro) de forma idempotente,
 * p. ej. al cancelar/rechazar un pedido previamente aplicado. Usa movimientos
 * `return` (entrada) con su propia `op_key`.
 */
export async function reverseLedgerSaleForOrder(db: Db, orderNumber: string): Promise<number> {
  const order = await loadOrder(db, orderNumber)
  if (!order) return 0
  const consumptions = await resolveVariantConsumptions(db, order.items.map((i) => i.variant_id))
  const plan = planSaleMovements(order.items, consumptions)
  let applied = 0
  for (const m of plan) {
    const res = await recordMovement(db, {
      tenant_id: order.tenant_id,
      stock_item_id: m.stock_item_id,
      movement_type: 'return',
      qty: m.qty_base,
      uom_factor: 1,
      reason: 'Reverso de venta',
      ref_type: 'order',
      ref_id: orderNumber,
      op_key: `sale-reverse:${orderNumber}:${m.stock_item_id}`,
    })
    if (!res.deduped) applied += 1
  }
  return applied
}
