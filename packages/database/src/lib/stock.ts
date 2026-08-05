/**
 * Control de inventario (Épica 9 · HU-098).
 *
 * El stock se descuenta cuando un pedido se paga (transición a `approved`) y se
 * repone si se cancela/rechaza. Ambas operaciones son **idempotentes** (flags
 * `stock_applied` / `stock_restored` en `orders`) para tolerar reintentos de
 * webhook, y el movimiento por variante es **atómico** vía RPC en Postgres.
 */

import { createServerClient } from '../client'

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
 * Devuelve stock y flag de backorder por variante (uniendo con products).
 * Usado por el checkout para validar disponibilidad antes de crear la orden.
 */
export async function getStockForVariants(variantIds: number[]): Promise<VariantStock[]> {
  if (!variantIds.length) return []
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, stock, products(allow_backorder)')
    .in('id', variantIds)
  if (error || !data) return []
  return (data as unknown as Array<{ id: number; stock: number | null; products: { allow_backorder?: boolean } | { allow_backorder?: boolean }[] | null }>).map((r) => ({
    variant_id: r.id,
    stock: r.stock ?? 0,
    allow_backorder: Array.isArray(r.products)
      ? !!r.products[0]?.allow_backorder
      : !!r.products?.allow_backorder,
  }))
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

  if (!claimed) return

  const items = (claimed.items ?? []) as OrderItemRef[]
  for (const it of items) {
    if (!it.variant_id || !it.qty) continue
    await supabase.rpc('decrement_variant_stock', { p_variant_id: it.variant_id, p_qty: it.qty })
  }
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

  if (!claimed) return

  const items = (claimed.items ?? []) as OrderItemRef[]
  for (const it of items) {
    if (!it.variant_id || !it.qty) continue
    await supabase.rpc('restore_variant_stock', { p_variant_id: it.variant_id, p_qty: it.qty })
  }
}
