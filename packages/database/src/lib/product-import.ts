/**
 * product-import — parser PURO y tolerante de catálogo en CSV (HU-124).
 *
 * Una fila = una variante. Las filas con el mismo `slug` forman un producto:
 * la primera fija los campos de producto (nombre, descripción, categoría,
 * imágenes, destacado…) y cada fila aporta una variante (precio/stock/SKU/…).
 *
 * Sin dependencias de Supabase ni de Node: se puede probar en aislamiento y
 * reutilizar en el endpoint de importación (que resuelve categoría→id, aplica
 * RLS por tenant y respeta el tope de plan).
 */

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface ImportVariantRow {
  price: number
  compare_at_price: number | null
  stock: number
  sku: string | null
  image_url: string | null
  active: boolean
  attributes: Record<string, string> | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
}

export interface ImportProduct {
  slug: string
  name: string
  description: string | null
  /** Nombre de categoría tal cual viene en el CSV; el endpoint lo resuelve a id. */
  category: string | null
  featured: boolean
  active: boolean
  seo_title: string | null
  seo_desc: string | null
  images: string[]
  variant_options: string[]
  variants: ImportVariantRow[]
}

export interface ImportParseError {
  /** Línea del CSV (1 = cabecera; los datos empiezan en 2). */
  row: number
  message: string
}

export interface ImportParseResult {
  products: ImportProduct[]
  errors: ImportParseError[]
}

// ── Columnas y plantilla ──────────────────────────────────────────────────────

/** Encabezados reconocidos (en minúscula). Se aceptan sinónimos frecuentes. */
export const PRODUCT_IMPORT_COLUMNS = [
  'slug', 'name', 'description', 'category', 'featured', 'active',
  'seo_title', 'seo_desc', 'images',
  'options', 'price', 'compare_at_price', 'stock', 'sku', 'variant_image',
  'variant_active', 'weight_kg', 'length_cm', 'width_cm', 'height_cm',
] as const

/** Plantilla descargable con cabecera + dos filas de ejemplo (un producto, 2 variantes). */
export const PRODUCT_IMPORT_TEMPLATE = [
  'slug,name,description,category,featured,active,seo_title,seo_desc,images,options,price,compare_at_price,stock,sku,variant_image,variant_active,weight_kg,length_cm,width_cm,height_cm',
  'camiseta-logo,Camiseta con logo,Camiseta 100% algodón,Ropa,true,true,,,https://ejemplo.com/foto1.jpg|https://ejemplo.com/foto2.jpg,Color=Negro;Talla=M,59900,79900,10,CAM-NEG-M,,true,0.3,30,25,3',
  'camiseta-logo,,,,,,,,,Color=Negro;Talla=L,59900,,8,CAM-NEG-L,,true,0.3,32,25,3',
].join('\n')

// ── Export (HU-130) · serializa productos a CSV compatible con el importador ──

export interface ExportVariant {
  price: number | null
  compare_at_price?: number | null
  stock?: number | null
  sku?: string | null
  image_url?: string | null
  active?: boolean | null
  attributes?: Record<string, string> | null
  weight_kg?: number | null
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
}

export interface ExportProduct {
  slug: string
  name: string
  description?: string | null
  /** Nombre de la categoría (no el id). */
  category?: string | null
  featured?: boolean | null
  active?: boolean | null
  seo_title?: string | null
  seo_desc?: string | null
  images?: (string | { url?: string | null })[] | null
  variant_options?: string[] | null
  variants: ExportVariant[]
}

/** Escapa una celda CSV (comillas, comas, saltos) según RFC4180. */
function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function imagesToField(images: ExportProduct['images']): string {
  if (!Array.isArray(images)) return ''
  return images
    .map((im) => (typeof im === 'string' ? im : im?.url ?? ''))
    .filter(Boolean)
    .join('|')
}

function optionsToField(attrs: Record<string, string> | null | undefined, order: string[]): string {
  if (!attrs) return ''
  const keys = order.length > 0 ? order.filter((k) => k in attrs) : Object.keys(attrs)
  // Incluye también claves presentes en attrs que no estén en el orden declarado.
  for (const k of Object.keys(attrs)) if (!keys.includes(k)) keys.push(k)
  return keys.map((k) => `${k}=${attrs[k]}`).join(';')
}

/**
 * Serializa productos a CSV (una fila por variante). Los campos de producto
 * van solo en la PRIMERA fila de cada producto (igual que espera el importador).
 * El header coincide con `PRODUCT_IMPORT_TEMPLATE`.
 */
export function productsToCsv(products: ExportProduct[]): string {
  const header = PRODUCT_IMPORT_COLUMNS as readonly string[]
  const lines: string[] = [header.join(',')]

  for (const p of products) {
    const order = Array.isArray(p.variant_options) ? p.variant_options : []
    const variants = p.variants.length > 0 ? p.variants : [{ price: null } as ExportVariant]

    variants.forEach((v, i) => {
      const first = i === 0
      const cells: Record<string, unknown> = {
        slug: p.slug,
        name: first ? p.name : '',
        description: first ? p.description ?? '' : '',
        category: first ? p.category ?? '' : '',
        featured: first ? (p.featured ? 'true' : 'false') : '',
        active: first ? (p.active === false ? 'false' : 'true') : '',
        seo_title: first ? p.seo_title ?? '' : '',
        seo_desc: first ? p.seo_desc ?? '' : '',
        images: first ? imagesToField(p.images) : '',
        options: optionsToField(v.attributes, order),
        price: v.price ?? '',
        compare_at_price: v.compare_at_price ?? '',
        stock: v.stock ?? 0,
        sku: v.sku ?? '',
        variant_image: v.image_url ?? '',
        variant_active: v.active === false ? 'false' : 'true',
        weight_kg: v.weight_kg ?? '',
        length_cm: v.length_cm ?? '',
        width_cm: v.width_cm ?? '',
        height_cm: v.height_cm ?? '',
      }
      lines.push(header.map((h) => csvCell(cells[h])).join(','))
    })
  }

  return lines.join('\n')
}

// ── CSV parser (RFC4180 básico: comillas, comas y saltos dentro de comillas) ──

/** Divide un texto CSV en filas de celdas. Tolera comillas dobles y CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  // Normaliza saltos y descarta BOM inicial.
  const s = text.replace(/^﻿/, '')

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ }  // comilla escapada ""
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++  // CRLF
      row.push(field); field = ''
      rows.push(row); row = []
    } else {
      field += c
    }
  }
  // Último campo/fila si el archivo no termina en salto.
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

// ── Helpers de celdas ─────────────────────────────────────────────────────────

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_')
}

/** Sinónimos de cabecera → columna canónica. */
const HEADER_ALIASES: Record<string, string> = {
  nombre: 'name', descripcion: 'description', categoria: 'category',
  destacado: 'featured', activo: 'active', imagenes: 'images',
  opciones: 'options', precio: 'price', precio_antes: 'compare_at_price',
  'precio_comparativo': 'compare_at_price', inventario: 'stock',
  imagen_variante: 'variant_image', variante_activa: 'variant_active',
  peso_kg: 'weight_kg', largo_cm: 'length_cm', ancho_cm: 'width_cm', alto_cm: 'height_cm',
}

function canonHeader(h: string): string {
  const n = normHeader(h)
  return HEADER_ALIASES[n] ?? n
}

function toBool(v: string | undefined, dflt = false): boolean {
  if (v == null || v.trim() === '') return dflt
  return /^(true|1|si|sí|yes|y|x)$/i.test(v.trim())
}

/**
 * Parsea número tolerando formato latino (miles con '.' y decimal con ',')
 * y formato inglés (miles con ',' y decimal con '.').
 */
function toNum(v: string | undefined): number | null {
  if (v == null) return null
  let s = v.trim().replace(/\s/g, '')
  if (s === '') return null

  const hasDot = s.includes('.')
  const hasComma = s.includes(',')

  if (hasDot && hasComma) {
    // El último separador es el decimal; el otro es de miles.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.') // latino
    else s = s.replace(/,/g, '')                                                            // inglés
  } else if (hasComma) {
    // Solo comas: decimal si hay una con 1-2 dígitos finales; si no, miles.
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  } else if (hasDot) {
    // Solo puntos: decimal si hay UN punto con 1-2 dígitos finales; si no, miles.
    const dots = (s.match(/\./g) ?? []).length
    if (dots > 1 || !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Parsea `Color=Rojo;Talla=M` → { Color: 'Rojo', Talla: 'M' } (orden preservado). */
function parseOptions(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw || !raw.trim()) return out
  for (const pair of raw.split(/[;|]/)) {
    const idx = pair.indexOf('=')
    if (idx === -1) continue
    const k = pair.slice(0, idx).trim()
    const val = pair.slice(idx + 1).trim()
    if (k) out[k] = val
  }
  return out
}

function cleanStr(v: string | undefined): string | null {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function parseProductsCsv(text: string): ImportParseResult {
  const errors: ImportParseError[] = []
  const rawRows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''))  // ignora líneas vacías

  if (rawRows.length < 2) {
    return { products: [], errors: [{ row: 1, message: 'El archivo no tiene filas de datos.' }] }
  }

  const headers = rawRows[0].map(canonHeader)
  const col = (cells: string[], name: string): string | undefined => {
    const i = headers.indexOf(name)
    return i === -1 ? undefined : cells[i]
  }

  if (!headers.includes('slug')) {
    return { products: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "slug".' }] }
  }
  if (!headers.includes('price')) {
    return { products: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "price" (precio).' }] }
  }

  // Mapa slug→producto (preserva orden de aparición).
  const bySlug = new Map<string, ImportProduct>()

  for (let r = 1; r < rawRows.length; r++) {
    const cells = rawRows[r]
    const lineNo = r + 1  // 1-indexado con cabecera en 1
    const slug = (col(cells, 'slug') ?? '').trim()
    if (!slug) { errors.push({ row: lineNo, message: 'Falta el slug.' }); continue }

    const price = toNum(col(cells, 'price'))
    if (price == null || price <= 0) {
      errors.push({ row: lineNo, message: `Precio inválido para "${slug}".` })
      continue
    }

    const attributes = parseOptions(col(cells, 'options'))
    const variant: ImportVariantRow = {
      price,
      compare_at_price: toNum(col(cells, 'compare_at_price')),
      stock: Math.trunc(toNum(col(cells, 'stock')) ?? 0),
      sku: cleanStr(col(cells, 'sku')),
      image_url: cleanStr(col(cells, 'variant_image')),
      active: toBool(col(cells, 'variant_active'), true),
      attributes: Object.keys(attributes).length > 0 ? attributes : null,
      weight_kg: toNum(col(cells, 'weight_kg')),
      length_cm: toNum(col(cells, 'length_cm')),
      width_cm: toNum(col(cells, 'width_cm')),
      height_cm: toNum(col(cells, 'height_cm')),
    }

    let product = bySlug.get(slug)
    if (!product) {
      const name = (col(cells, 'name') ?? '').trim()
      if (!name) {
        errors.push({ row: lineNo, message: `La primera fila de "${slug}" debe incluir el nombre.` })
        continue
      }
      product = {
        slug,
        name,
        description: cleanStr(col(cells, 'description')),
        category: cleanStr(col(cells, 'category')),
        featured: toBool(col(cells, 'featured')),
        active: toBool(col(cells, 'active'), true),
        seo_title: cleanStr(col(cells, 'seo_title')),
        seo_desc: cleanStr(col(cells, 'seo_desc')),
        images: (cleanStr(col(cells, 'images')) ?? '').split(/[|]/).map((u) => u.trim()).filter(Boolean),
        variant_options: [],
        variants: [],
      }
      bySlug.set(slug, product)
    }

    // variant_options = unión de claves de atributos (orden de aparición).
    if (variant.attributes) {
      for (const k of Object.keys(variant.attributes)) {
        if (!product.variant_options.includes(k)) product.variant_options.push(k)
      }
    }
    product.variants.push(variant)
  }

  // Descarta productos sin variantes válidas (no debería pasar, por seguridad).
  const products = [...bySlug.values()].filter((p) => p.variants.length > 0)
  return { products, errors }
}
