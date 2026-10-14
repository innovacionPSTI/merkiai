import type { Db } from '../client'

/**
 * Lista de deseos por cuenta (HU-103 v2). El comprador logueado persiste sus
 * favoritos en BD (RLS `wishlist_own`). El invitado usa localStorage y al
 * iniciar sesión se fusiona (merge). `db` por parámetro (RLS por tenant).
 */

export interface WishlistCard {
  id: number
  slug: string
  name: string
  imageUrl: string | null
  price: number | null
  inStock: boolean
}

interface VariantStock { stock: number | null; active: boolean | null }
interface ProductStockRow {
  id: number
  allow_backorder: boolean | null
  product_variants?: VariantStock[] | null
}

/** Un producto está "disponible" si admite backorder o alguna variante activa tiene stock. */
function computeInStock(p: ProductStockRow): boolean {
  if (p.allow_backorder) return true
  const vs = Array.isArray(p.product_variants) ? p.product_variants : []
  return vs.some((v) => v.active && Number(v.stock) > 0)
}

/**
 * Mapa product_id → disponibilidad (HU-103 v2 / HU-105). Útil para marcar
 * "agotado" en la wishlist (invitado o logueado). Solo productos activos.
 */
export async function getProductsStockMap(db: Db, ids: number[]): Promise<Record<number, boolean>> {
  const unique = [...new Set(ids.filter((n) => Number.isInteger(n)))]
  if (unique.length === 0) return {}
  const { data } = await db
    .from('products')
    .select('id, allow_backorder, product_variants(stock, active)')
    .eq('active', true)
    .in('id', unique)
  const out: Record<number, boolean> = {}
  for (const p of (data ?? []) as ProductStockRow[]) out[p.id] = computeInStock(p)
  return out
}

interface WishlistProductRow {
  id: number
  slug: string
  name: string
  images: unknown
  min_price: number | null
  allow_backorder: boolean | null
  product_variants?: VariantStock[] | null
}

/** Favoritos del cliente como tarjetas (con disponibilidad), más recientes primero. */
export async function getWishlist(db: Db, customerId: string): Promise<WishlistCard[]> {
  const { data: rows } = await db
    .from('wishlist_items')
    .select('product_id, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  const ids = (rows ?? []).map((r: { product_id: number }) => r.product_id)
  if (ids.length === 0) return []

  const { data: products } = await db
    .from('products')
    .select('id, slug, name, images, min_price, allow_backorder, product_variants(stock, active)')
    .eq('active', true)
    .in('id', ids)
  const byId = new Map((products ?? []).map((p: WishlistProductRow) => [p.id, p]))

  // Preserva el orden de la wishlist (más reciente primero).
  const out: WishlistCard[] = []
  for (const id of ids) {
    const p = byId.get(id) as WishlistProductRow | undefined
    if (!p) continue
    const imgs = Array.isArray(p.images) ? (p.images as Array<{ url?: string }>) : []
    out.push({ id: p.id, slug: p.slug, name: p.name, imageUrl: imgs[0]?.url ?? null, price: p.min_price ?? null, inStock: computeInStock(p) })
  }
  return out
}

/** Agrega favoritos (bulk, idempotente por índice único). Usado por el merge en login. */
export async function addWishlistItems(db: Db, customerId: string, productIds: number[], tenantId: string): Promise<void> {
  const unique = [...new Set(productIds.filter((n) => Number.isInteger(n) && n > 0))]
  if (unique.length === 0) return
  const rows = unique.map((product_id) => ({ tenant_id: tenantId, customer_id: customerId, product_id }))
  await db.from('wishlist_items').upsert(rows, { onConflict: 'tenant_id,customer_id,product_id', ignoreDuplicates: true })
}

/** Quita un favorito del cliente. */
export async function removeWishlistItem(db: Db, customerId: string, productId: number): Promise<void> {
  await db.from('wishlist_items').delete().eq('customer_id', customerId).eq('product_id', productId)
}
