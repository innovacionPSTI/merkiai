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

  // Aggregate order_items by product_id
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_name, image_url, qty')

  if (items?.length) {
    const map = new Map<number, BestSellingProduct>()
    for (const item of items) {
      const pid = item.product_id as number
      const existing = map.get(pid)
      if (existing) {
        existing.total_sold += (item.qty as number)
      } else {
        map.set(pid, {
          product_id: pid,
          product_name: item.product_name as string,
          image_url: item.image_url as string | null,
          slug: null,
          total_sold: item.qty as number,
        })
      }
    }

    // Enrich with slug from products table
    const productIds = [...map.keys()]
    const { data: products } = await supabase
      .from('products')
      .select('id, slug')
      .in('id', productIds)
      .eq('active', true)

    for (const p of products ?? []) {
      const entry = map.get(p.id as number)
      if (entry) entry.slug = p.slug as string
    }

    const sorted = [...map.values()]
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit)

    if (sorted.length > 0) return sorted
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
