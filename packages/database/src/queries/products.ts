import { createServerClient, type Db } from '../client'
import type { Category, ProductWithVariants } from '../types'

/**
 * Nota (E17/HU-156): las queries reciben el cliente `db` por parámetro. Por
 * defecto usan el cliente service-role actual (comportamiento idéntico al de
 * hoy), de modo que este refactor es no disruptivo. En multi-tenant, el llamador
 * pasará un `createTenantClient` (sujeto a RLS) sin cambiar estas funciones.
 */

export async function getProducts(
  filters?: {
    roast?: string
    weight?: string
    brew_method?: string
    featured?: boolean
    category_slug?: string
  },
  db: Db = createServerClient(),
) {
  const supabase = db
  let query = supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (filters?.featured) query = query.eq('featured', true)
  if (filters?.category_slug) {
    query = query.eq('categories.slug', filters.category_slug)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as ProductWithVariants[]
}

export async function getProductBySlug(slug: string, db: Db = createServerClient()) {
  const supabase = db
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error) throw error
  return data as unknown as ProductWithVariants
}

export async function getFeaturedProducts(limit = 3, db: Db = createServerClient()) {
  return getProducts({ featured: true }, db)
    .then((products) => products.slice(0, limit))
}

export interface BestSellingProduct {
  product_id: number
  product_name: string
  image_url: string | null
  slug: string | null
  total_sold: number
}

/**
 * Devuelve los N productos más vendidos agregando order_items por product_id.
 * Fallback: si no hay ventas, devuelve los productos más recientes activos.
 */
export async function getBestSellingProducts(
  limit = 4,
  db: Db = createServerClient(),
): Promise<BestSellingProduct[]> {
  const supabase = db

  // Agrega ventas desde `orders.items` (JSONB): NO existe tabla `order_items`,
  // los ítems viven en el snapshot del pedido. Se cuenta la cantidad por
  // variante y se resuelve el producto vía `product_variants`.
  const { data: orders } = await supabase
    .from('orders')
    .select('items, status')
    .neq('status', 'cancelled')

  const qtyByVariant = new Map<number, number>()
  for (const o of orders ?? []) {
    const list = Array.isArray(o.items) ? (o.items as Array<{ variant_id?: number; qty?: number }>) : []
    for (const it of list) {
      if (!it?.variant_id) continue
      qtyByVariant.set(it.variant_id, (qtyByVariant.get(it.variant_id) ?? 0) + (Number(it.qty) || 0))
    }
  }

  if (qtyByVariant.size > 0) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .in('id', [...qtyByVariant.keys()])

    const qtyByProduct = new Map<number, number>()
    for (const v of variants ?? []) {
      const pid = v.product_id as number
      qtyByProduct.set(pid, (qtyByProduct.get(pid) ?? 0) + (qtyByVariant.get(v.id as number) ?? 0))
    }

    if (qtyByProduct.size > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, slug, images')
        .in('id', [...qtyByProduct.keys()])
        .eq('active', true)

      const sorted = (products ?? [])
        .map((p) => {
          const imgs = Array.isArray(p.images) ? (p.images as Array<{ url: string }>) : []
          return {
            product_id: p.id as number,
            product_name: p.name as string,
            image_url: imgs[0]?.url ?? null,
            slug: p.slug as string,
            total_sold: qtyByProduct.get(p.id as number) ?? 0,
          }
        })
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, limit)

      if (sorted.length > 0) return sorted
    }
  }

  // Fallback: productos más recientes
  const { data: fallback } = await supabase
    .from('products')
    .select('id, name, slug, images')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (fallback ?? []).map((p) => {
    const imgs = Array.isArray(p.images) ? p.images as Array<{ url: string }> : []
    return {
      product_id: p.id as number,
      product_name: p.name as string,
      image_url: imgs[0]?.url ?? null,
      slug: p.slug as string,
      total_sold: 0,
    }
  })
}

/**
 * Devuelve todas las categorías activas ordenadas por order_index.
 * Usado en la home para los links de la sección "Tienda".
 */
export async function getCategories(db: Db = createServerClient()): Promise<Category[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('order_index', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}
