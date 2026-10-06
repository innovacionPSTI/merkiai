/**
 * shop-filters — helpers PUROS de búsqueda y paginación de la tienda (storefront).
 * Separados de ShopClient para poder testearlos en aislamiento.
 */
import type { ProductWithVariants } from '@merkiai/database'

/** Normaliza para comparar insensible a mayúsculas y acentos. */
export function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * ¿El producto coincide con el texto buscado? Busca en nombre, descripción,
 * nombre de categoría y SKUs de variantes. `query` vacío → coincide siempre.
 */
export function matchesQuery(p: ProductWithVariants, query: string): boolean {
  const q = norm(query.trim())
  if (!q) return true
  const haystack = norm([
    p.name,
    p.description ?? '',
    p.category?.name ?? '',
    ...(p.variants ?? []).map((v) => v.sku ?? ''),
  ].join(' '))
  return haystack.includes(q)
}

export interface Paged<T> {
  items: T[]
  pageCount: number
  safePage: number
}

/** Pagina una lista (1-indexado); corrige la página fuera de rango. */
export function paginate<T>(list: T[], page: number, size: number): Paged<T> {
  const pageCount = Math.max(1, Math.ceil(list.length / size))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const items = list.slice((safePage - 1) * size, safePage * size)
  return { items, pageCount, safePage }
}

// ── Sincronización de estado con la URL (compartible/bookmarkable) ────────────

export interface ShopUrlState {
  q: string
  categoria: number | null
  orden: string
  page: number
  /** Atributos seleccionados { Color: 'Rojo' } (en la URL como attr_<Nombre>). */
  attrs: Record<string, string>
}

type RawParams = Record<string, string | string[] | undefined>

const str = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? ''

const ATTR_PREFIX = 'attr_'

/** Lee el estado inicial del shop desde los searchParams (con defaults). */
export function parseShopUrl(sp: RawParams): ShopUrlState {
  const cat = str(sp.categoria)
  const pageNum = parseInt(str(sp.page), 10)
  const attrs: Record<string, string> = {}
  for (const [k, v] of Object.entries(sp)) {
    if (k.startsWith(ATTR_PREFIX)) {
      const val = str(v)
      if (val) attrs[k.slice(ATTR_PREFIX.length)] = val
    }
  }
  return {
    q: str(sp.q),
    categoria: cat && Number.isFinite(Number(cat)) ? Number(cat) : null,
    orden: str(sp.orden) || 'destacados',
    page: Number.isFinite(pageNum) && pageNum > 1 ? pageNum : 1,
    attrs,
  }
}

/** Construye el querystring canónico (omite defaults) para el estado dado. */
export function buildShopQuery(s: ShopUrlState): string {
  const p = new URLSearchParams()
  if (s.q.trim()) p.set('q', s.q.trim())
  if (s.categoria != null) p.set('categoria', String(s.categoria))
  if (s.orden && s.orden !== 'destacados') p.set('orden', s.orden)
  if (s.page > 1) p.set('page', String(s.page))
  // Orden estable de atributos para URLs canónicas.
  for (const k of Object.keys(s.attrs).sort()) {
    if (s.attrs[k]) p.set(ATTR_PREFIX + k, s.attrs[k])
  }
  return p.toString()
}
