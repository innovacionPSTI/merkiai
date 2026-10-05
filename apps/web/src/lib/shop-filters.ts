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
