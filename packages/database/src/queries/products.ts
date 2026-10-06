import type { Db } from '../client'
import type { Category, ProductWithVariants } from '../types'

/**
 * Nota (E17/HU-156): las queries reciben el cliente `db` por parámetro. Por
 * defecto usan el cliente service-role actual (comportamiento idéntico al de
 * hoy), de modo que este refactor es no disruptivo. En multi-tenant, el llamador
 * pasará un `createTenantClient` (sujeto a RLS) sin cambiar estas funciones.
 */

export async function getProducts(
  filters: {
    featured?: boolean
    category_slug?: string
  } = {},
  db: Db,
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

// ── HU-270 · Catálogo server-side (búsqueda + facetas + paginación en BD) ─────

export interface CatalogFacets {
  categories: { id: number; name: string }[]
  /** Atributos de variante con ≥2 valores (color/talla…) para filtrar. */
  attrFilters: { name: string; values: string[] }[]
}

/**
 * Facetas del catálogo (consulta ligera, separada del grid paginado):
 * categorías activas + valores de atributos de variantes activas de productos
 * activos. Solo lee `attributes` (no trae imágenes/descripciones).
 */
export async function getCatalogFacets(db: Db): Promise<CatalogFacets> {
  const supabase = db

  const [{ data: cats }, { data: variantRows }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('active', true).order('order_index', { ascending: true }),
    supabase
      .from('product_variants')
      .select('attributes, products!inner(active)')
      .eq('active', true)
      .eq('products.active', true),
  ])

  const optionMap = new Map<string, Set<string>>()
  for (const row of (variantRows ?? []) as Array<{ attributes: unknown }>) {
    const attrs = (row.attributes && typeof row.attributes === 'object') ? row.attributes as Record<string, string> : null
    if (!attrs) continue
    for (const [k, v] of Object.entries(attrs)) {
      if (!v) continue
      if (!optionMap.has(k)) optionMap.set(k, new Set())
      optionMap.get(k)!.add(v)
    }
  }

  const attrFilters = [...optionMap.entries()]
    .filter(([, vals]) => vals.size >= 2)
    .map(([name, vals]) => ({ name, values: [...vals] }))

  return {
    categories: (cats ?? []).map((c: any) => ({ id: c.id, name: c.name })),
    attrFilters,
  }
}

export interface ProductsPageOpts {
  search?: string
  categoryId?: number | null
  /** Atributos seleccionados { Color: 'Rojo', Talla: 'M' }. */
  attrs?: Record<string, string>
  sort?: string
  limit?: number
  offset?: number
}

export interface ProductsPage {
  products: ProductWithVariants[]
  total: number
}

/** Quita caracteres que romperían el filtro `or` de PostgREST. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,()*\\]/g, ' ').trim()
}

/**
 * Página del catálogo filtrada/ordenada/paginada EN BD (HU-270). El precio se
 * ordena por `products.min_price` (denormalizado por trigger). Los atributos se
 * resuelven por intersección de `product_id` (una variante activa por atributo,
 * misma semántica que el filtro client-side v1).
 */
export async function getProductsPage(db: Db, opts: ProductsPageOpts = {}): Promise<ProductsPage> {
  const supabase = db
  const { search = '', categoryId = null, attrs = {}, sort = 'destacados', limit = 12, offset = 0 } = opts

  // Resolución de atributos → conjunto de product_id candidatos (intersección).
  const activeAttrs = Object.entries(attrs).filter(([, v]) => v)
  let candidateIds: number[] | null = null
  for (const [k, v] of activeAttrs) {
    const { data } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('active', true)
      .contains('attributes', { [k]: v })
    const ids = new Set<number>((data ?? []).map((r: any) => r.product_id as number))
    candidateIds = candidateIds === null ? [...ids] : candidateIds.filter((id) => ids.has(id))
    if (candidateIds.length === 0) return { products: [], total: 0 }
  }

  let query = supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)', { count: 'exact' })
    .eq('active', true)

  if (categoryId != null) query = query.eq('category_id', categoryId)
  if (candidateIds !== null) query = query.in('id', candidateIds)

  const q = sanitizeSearch(search)
  if (q) query = query.or(`name.ilike.*${q}*,description.ilike.*${q}*`)

  switch (sort) {
    case 'precio-asc':  query = query.order('min_price', { ascending: true,  nullsFirst: false }); break
    case 'precio-desc': query = query.order('min_price', { ascending: false, nullsFirst: false }); break
    case 'nombre':      query = query.order('name', { ascending: true }); break
    default:            query = query.order('featured', { ascending: false }).order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { products: (data ?? []) as unknown as ProductWithVariants[], total: count ?? 0 }
}

export async function getProductBySlug(slug: string, db: Db) {
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

export async function getFeaturedProducts(limit = 3, db: Db) {
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
  db: Db,
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
export async function getCategories(db: Db): Promise<Category[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('order_index', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export type CategoryWithChildren = Category & { children: CategoryWithChildren[] }

/**
 * HU-263 · Construye el árbol de categorías a partir de la lista plana
 * (pura, testeable). Las raíces son las de `parent_id` nulo o cuyo padre no está
 * en la lista (defensivo). Conserva el orden de entrada (ya viene por order_index).
 */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const byId = new Map<number, CategoryWithChildren>()
  for (const c of categories) byId.set(c.id, { ...c, children: [] })
  const roots: CategoryWithChildren[] = []
  for (const c of categories) {
    const node = byId.get(c.id)!
    const parent = c.parent_id != null ? byId.get(c.parent_id) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}
