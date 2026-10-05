/**
 * blog-import — parser PURO de posts del blog en CSV (HU-132). Reusa `parseCsv`.
 * Identidad por `slug`. Reporta por slug.
 */
import { parseCsv } from './product-import'

export interface ImportBlogPost {
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  category: string | null
  published: boolean
  published_at: string | null
  seo_title: string | null
  seo_desc: string | null
}

export interface BlogParseError { row: number; message: string }
export interface BlogParseResult { posts: ImportBlogPost[]; errors: BlogParseError[] }

export const BLOG_IMPORT_TEMPLATE = [
  'slug,title,excerpt,content,cover_image,category,published,published_at,seo_title,seo_desc',
  'bienvenida,Bienvenida a la tienda,Nuestro primer artículo,"Hola, este es el contenido.",,Noticias,true,2026-01-15,,',
  'guia-cafe,Guía de café,Cómo preparar el mejor café,Contenido largo…,,Guías,false,,,',
].join('\n')

const ALIASES: Record<string, string> = {
  titulo: 'title', título: 'title', resumen: 'excerpt', contenido: 'content',
  imagen: 'cover_image', imagen_portada: 'cover_image', portada: 'cover_image',
  categoria: 'category', categoría: 'category', publicado: 'published',
  fecha_publicacion: 'published_at', fecha: 'published_at',
}
const canon = (h: string) => {
  const n = h.trim().toLowerCase().replace(/\s+/g, '_')
  return ALIASES[n] ?? n
}
const clean = (v: string | undefined): string | null => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}
const toBool = (v: string | undefined, dflt = false) => {
  if (v == null || v.trim() === '') return dflt
  return /^(true|1|si|sí|yes|y|x)$/i.test(v.trim())
}

export function parseBlogPostsCsv(text: string): BlogParseResult {
  const errors: BlogParseError[] = []
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''))
  if (rows.length < 2) return { posts: [], errors: [{ row: 1, message: 'El archivo no tiene filas de datos.' }] }

  const headers = rows[0].map(canon)
  if (!headers.includes('slug')) return { posts: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "slug".' }] }
  if (!headers.includes('title')) return { posts: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "title" (título).' }] }
  const col = (cells: string[], name: string) => {
    const i = headers.indexOf(name)
    return i === -1 ? undefined : cells[i]
  }

  const bySlug = new Map<string, ImportBlogPost>()
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const lineNo = r + 1
    const slug = (col(cells, 'slug') ?? '').trim()
    const title = (col(cells, 'title') ?? '').trim()
    if (!slug) { errors.push({ row: lineNo, message: 'Falta el slug.' }); continue }
    if (!title) { errors.push({ row: lineNo, message: `Falta el título para "${slug}".` }); continue }
    if (bySlug.has(slug)) { errors.push({ row: lineNo, message: `Slug duplicado en el archivo: "${slug}".` }); continue }

    const published = toBool(col(cells, 'published'))
    const publishedAt = clean(col(cells, 'published_at'))
    bySlug.set(slug, {
      slug, title,
      excerpt: clean(col(cells, 'excerpt')),
      content: clean(col(cells, 'content')),
      cover_image: clean(col(cells, 'cover_image')),
      category: clean(col(cells, 'category')),
      published,
      // Si se publica sin fecha, se marca con la fecha actual.
      published_at: publishedAt ?? (published ? new Date().toISOString() : null),
      seo_title: clean(col(cells, 'seo_title')),
      seo_desc: clean(col(cells, 'seo_desc')),
    })
  }

  return { posts: [...bySlug.values()], errors }
}
