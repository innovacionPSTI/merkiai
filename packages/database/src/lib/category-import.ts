/**
 * category-import — parser PURO de categorías en CSV (HU-132). Reutiliza el
 * motor `parseCsv` del importador de productos. El vínculo con la categoría
 * madre se expresa por `parent_slug` (el endpoint lo resuelve a `parent_id`).
 */
import { parseCsv } from './product-import'

export interface ImportCategory {
  slug: string
  name: string
  description: string | null
  parent_slug: string | null
  meta_title: string | null
  meta_description: string | null
  image_url: string | null
  active: boolean
  order_index: number | null
}

export interface CategoryParseError { row: number; message: string }
export interface CategoryParseResult {
  categories: ImportCategory[]
  errors: CategoryParseError[]
}

export const CATEGORY_IMPORT_TEMPLATE = [
  'slug,name,description,parent_slug,meta_title,meta_description,image_url,active,order_index',
  'ropa,Ropa,Prendas de vestir,,Ropa | Mi Tienda,Camisetas y más,,true,0',
  'camisetas,Camisetas,,ropa,,,,true,1',
].join('\n')

const ALIASES: Record<string, string> = {
  nombre: 'name', descripcion: 'description', categoria_madre: 'parent_slug',
  madre: 'parent_slug', padre: 'parent_slug', imagen: 'image_url', activa: 'active',
  activo: 'active', orden: 'order_index',
}
const canon = (h: string) => {
  const n = h.trim().toLowerCase().replace(/\s+/g, '_')
  return ALIASES[n] ?? n
}
const clean = (v: string | undefined): string | null => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}
const toBool = (v: string | undefined, dflt = true) => {
  if (v == null || v.trim() === '') return dflt
  return /^(true|1|si|sí|yes|y|x)$/i.test(v.trim())
}

export function parseCategoriesCsv(text: string): CategoryParseResult {
  const errors: CategoryParseError[] = []
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''))
  if (rows.length < 2) return { categories: [], errors: [{ row: 1, message: 'El archivo no tiene filas de datos.' }] }

  const headers = rows[0].map(canon)
  if (!headers.includes('slug')) return { categories: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "slug".' }] }
  if (!headers.includes('name')) return { categories: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "name" (nombre).' }] }

  const col = (cells: string[], name: string) => {
    const i = headers.indexOf(name)
    return i === -1 ? undefined : cells[i]
  }

  const bySlug = new Map<string, ImportCategory>()
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const lineNo = r + 1
    const slug = (col(cells, 'slug') ?? '').trim()
    const name = (col(cells, 'name') ?? '').trim()
    if (!slug) { errors.push({ row: lineNo, message: 'Falta el slug.' }); continue }
    if (!name) { errors.push({ row: lineNo, message: `Falta el nombre para "${slug}".` }); continue }
    if (bySlug.has(slug)) { errors.push({ row: lineNo, message: `Slug duplicado en el archivo: "${slug}".` }); continue }

    const oi = clean(col(cells, 'order_index'))
    bySlug.set(slug, {
      slug,
      name,
      description: clean(col(cells, 'description')),
      parent_slug: clean(col(cells, 'parent_slug')),
      meta_title: clean(col(cells, 'meta_title')),
      meta_description: clean(col(cells, 'meta_description')),
      image_url: clean(col(cells, 'image_url')),
      active: toBool(col(cells, 'active')),
      order_index: oi != null && Number.isFinite(Number(oi)) ? Math.trunc(Number(oi)) : null,
    })
  }

  // Valida que la categoría madre exista en el propio archivo o se omita (el
  // endpoint también considera las ya existentes en la BD). Aquí solo avisamos
  // de un parent que apunta a sí mismo.
  for (const c of bySlug.values()) {
    if (c.parent_slug && c.parent_slug === c.slug) {
      errors.push({ row: 0, message: `"${c.slug}" no puede ser su propia categoría madre.` })
      c.parent_slug = null
    }
  }

  return { categories: [...bySlug.values()], errors }
}
