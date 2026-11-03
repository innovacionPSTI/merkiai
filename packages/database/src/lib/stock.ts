/**
 * Control de inventario (Épica 9 · HU-098 + E18·HU-178).
 *
 * El stock se descuenta cuando un pedido se paga (transición a `approved`) y se
 * repone si se cancela/rechaza. Ambas operaciones son **idempotentes** (flags
 * `stock_applied` / `stock_restored` en `orders`) para tolerar reintentos de
 * webhook, y el movimiento por variante es **atómico** vía RPC en Postgres.
 *
 * E18·HU-178: la venta **además** anexa movimientos `sale`/`return` al **libro de
 * inventario** (ledger) para las variantes enlazadas a un `stock_item`. Es un
 * corte **gobernado por datos** (no por flag): solo afecta a variantes enlazadas;
 * las no enlazadas siguen el descuento legacy sobre `product_variants.stock`. Para
 * la disponibilidad, el ledger solo gobierna un ítem **cuando ya tiene presencia
 * en el libro** (ver `mergeLedgerAvailability`), de modo que una tienda que aún no
 * inicializó saldos no se bloquea.
 */

import { createServerClient } from '../client'
import { applyLedgerSaleForOrder, reverseLedgerSaleForOrder, resolveVariantConsumptions } from '../queries/sale-ledger'
import { getAvailableMap } from '../queries/stock-movements'

interface OrderItemRef {
  variant_id?: number
  qty?: number
}

export interface VariantStock {
  variant_id: number
  stock: number
  allow_backorder: boolean
}

/**
 * E18·HU-178 · sobrescribe el `stock` legacy con el **disponible del ledger** para
 * las variantes enlazadas a un `stock_item` de consumo **directo** (terminado
 * stocked / `al_producir`), **solo si el ítem ya tiene presencia en el libro**
 * (`availableMap` trae una entrada). Si el ítem aún no se inicializó en el ledger,
 * o es `al_vender`/no enlazado, conserva el `stock` legacy → no se bloquea. Pura.
 */
export function mergeLedgerAvailability(
  base: VariantStock[],
  finishedByVariant: Map<number, number>,
  availableMap: Record<number, number>,
): VariantStock[] {
  return base.map((r) => {
    const sid = finishedByVariant.get(r.variant_id)
    if (sid == null) return r
    const avail = availableMap[sid]
    if (avail == null) return r // sin presencia en el libro → stock legacy (cero bloqueo)
    return { ...r, stock: avail }
  })
}

/**
 * Devuelve stock y flag de backorder por variante (uniendo con products).
 * Usado por el checkout para validar disponibilidad antes de crear la orden.
 * El disponible de variantes enlazadas (directas) con presencia en el libro se
 * lee del ledger (ver `mergeLedgerAvailability`); el resto conserva stock legacy.
 */
export async function getStockForVariants(variantIds: number[]): Promise<VariantStock[]> {
  if (!variantIds.length) return []
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, stock, products(allow_backorder)')
    .in('id', variantIds)
  if (error || !data) return []
  const base = (data as unknown as Array<{ id: number; stock: number | null; products: { allow_backorder?: boolean } | { allow_backorder?: boolean }[] | null }>).map((r) => ({
    variant_id: r.id,
    stock: r.stock ?? 0,
    allow_backorder: Array.isArray(r.products)
      ? !!r.products[0]?.allow_backorder
      : !!r.products?.allow_backorder,
  }))

  // Variantes enlazadas de consumo directo → disponible del ledger (si tienen
  // presencia en el libro). Gobernado por datos: sin enlaces, no cambia nada.
  const consumptions = await resolveVariantConsumptions(supabase, variantIds)
  const finishedByVariant = new Map<number, number>()
  for (const c of consumptions) {
    if (c.finished_stock_item_id != null) finishedByVariant.set(c.variant_id, c.finished_stock_item_id)
  }
  if (finishedByVariant.size === 0) return base
  const availableMap = await getAvailableMap(supabase, [...new Set(finishedByVariant.values())])
  return mergeLedgerAvailability(base, finishedByVariant, availableMap)
}

/**
 * Descuenta el stock de un pedido — SOLO una vez (idempotente).
 * Se llama en la transición del pago a `approved` (webhooks, validación manual,
 * reconcile). El RPC respeta `allow_backorder` de cada producto.
 */
export async function applyStockForOrder(orderNumber: string): Promise<void> {
  const supabase = createServerClient()

  // Reclamo idempotente: solo procede quien logre poner stock_applied de false→true.
  const { data: claimed } = await supabase
    .from('orders')
    .update({ stock_applied: true })
    .eq('order_number', orderNumber)
    .eq('stock_applied', false)
    .select('items')
    .maybeSingle()

  if (claimed) {
    const items = (claimed.items ?? []) as OrderItemRef[]
    for (const it of items) {
      if (!it.variant_id || !it.qty) continue
      await supabase.rpc('decrement_variant_stock', { p_variant_id: it.variant_id, p_qty: it.qty })
    }
  }

  // E18·HU-178: corte al ledger para variantes enlazadas. Independiente del reclamo
  // legacy e idempotente por op_key (tolera reintentos de webhook); no-op para
  // tiendas sin variantes enlazadas a un stock_item.
  await applyLedgerSaleForOrder(supabase, orderNumber)
}

/**
 * Repone el stock de un pedido que ya había descontado — SOLO una vez.
 * Se llama al cancelar o rechazar un pedido previamente aprobado.
 */
export async function restoreStockForOrder(orderNumber: string): Promise<void> {
  const supabase = createServerClient()

  const { data: claimed } = await supabase
    .from('orders')
    .update({ stock_restored: true })
    .eq('order_number', orderNumber)
    .eq('stock_applied', true)     // solo repone si se había descontado
    .eq('stock_restored', false)
    .select('items')
    .maybeSingle()

  if (claimed) {
    const items = (claimed.items ?? []) as OrderItemRef[]
    for (const it of items) {
      if (!it.variant_id || !it.qty) continue
      await supabase.rpc('restore_variant_stock', { p_variant_id: it.variant_id, p_qty: it.qty })
    }
  }

  // E18·HU-178: reverso en el ledger para variantes enlazadas (idempotente; no-op
  // si no hay enlaces).
  await reverseLedgerSaleForOrder(supabase, orderNumber)
}
