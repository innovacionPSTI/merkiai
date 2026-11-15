/**
 * queries/translations.ts — Contenido traducible con fallback (E28 · HU-463 · ADR-011 §2.3).
 *
 * El contenido actual de cada entidad (columnas de `products`, `categories`,
 * `blog_posts`, `pages`) ES el idioma por defecto de la tienda. Las traducciones
 * viven en tablas `<entidad>_translations` (una fila por entidad y locale) y se
 * superponen campo a campo siguiendo la cadena:
 *
 *     locale pedido (es-MX) → idioma base (es) → contenido por defecto
 *
 * Un campo traducido vacío NUNCA tapa al siguiente nivel (AC-2: nunca vacío).
 * Si ningún campo cae en una traducción propia, la fila queda marcada como
 * no traducida (`_translated: false`) para que el `hreflang`/sitemap no la
 * anuncie en ese idioma (AC-3).
 */
import { localeChain, normalizeLocale } from '@merkiai/i18n'
import type { Db } from '../client'

export type TranslatableEntity = 'product' | 'category' | 'blog_post' | 'page'

interface EntityDef {
  table: string
  /** Columna FK en la tabla de traducciones. */
  fk: string
  /** Columna de la entidad que referencia `fk` (id o key). */
  idField: string
  /** Campos traducibles (mismo nombre en la entidad y en la tabla de traducciones). */
  fields: readonly string[]
}

export const TRANSLATABLE: Record<TranslatableEntity, EntityDef> = {
  product:   { table: 'product_translations',   fk: 'product_id',  idField: 'id',  fields: ['name', 'description', 'slug', 'seo_title', 'seo_desc'] },
  category:  { table: 'category_translations',  fk: 'category_id', idField: 'id',  fields: ['name', 'description', 'slug', 'meta_title', 'meta_description'] },
  blog_post: { table: 'blog_post_translations', fk: 'post_id',     idField: 'id',  fields: ['title', 'excerpt', 'content', 'slug', 'seo_title', 'seo_desc'] },
  page:      { table: 'page_translations',      fk: 'page_key',    idField: 'key', fields: ['label', 'slug', 'meta_title', 'meta_description'] },
}

/** Metadatos que se agregan a una fila localizada. */
export interface LocalizedMeta {
  /** Locale efectivo de la fila (el pedido si hubo al menos un campo propio). */
  _locale: string
  /** true si al menos un campo salió de una traducción del locale/idioma pedido. */
  _translated: boolean
  /** Slug del contenido por defecto (para redirecciones/canónicas). */
  _baseSlug?: string | null
}

export type TranslationRow = Record<string, unknown> & { locale: string }

/** Cadena de traducción para un locale, sin el locale por defecto de la tienda (ese es el contenido base). */
export function translationChain(locale: string, defaultLocale: string): string[] {
  const def = normalizeLocale(defaultLocale) ?? defaultLocale
  // Sin la referencia de plataforma (`es`) al final: el respaldo es el contenido base de la tienda.
  const chain = localeChain(locale).filter((t) => t !== 'es' || locale.toLowerCase().startsWith('es'))
  return chain.filter((t) => t !== def)
}

const isFilled = (v: unknown) => typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined

/**
 * Superpone las traducciones a una fila base. PURA.
 * `rows` son las traducciones de ESTA entidad (cualquier orden).
 */
export function mergeTranslation<T extends Record<string, unknown>>(
  base: T,
  rows: TranslationRow[],
  locale: string,
  defaultLocale: string,
  fields: readonly string[],
): T & LocalizedMeta {
  const chain = translationChain(locale, defaultLocale)
  const byLocale = new Map(rows.map((r) => [r.locale, r]))
  const out: Record<string, unknown> = { ...base }
  let translated = false
  for (const f of fields) {
    for (const tag of chain) {
      const v = byLocale.get(tag)?.[f]
      if (isFilled(v)) { out[f] = v; if (f !== 'slug') translated = true; break }
    }
  }
  return {
    ...(out as T),
    _locale: translated ? locale : defaultLocale,
    _translated: chain.length === 0 ? true : translated,
    _baseSlug: (base as Record<string, unknown>).slug as string | null | undefined ?? null,
  }
}

function sameLocale(a: string, b: string) {
  return (normalizeLocale(a) ?? a) === (normalizeLocale(b) ?? b)
}

/**
 * Localiza filas de una entidad. En el locale por defecto NO consulta la BD
 * (cero costo para tiendas de un idioma). Fail-safe: si la consulta falla,
 * devuelve el contenido base.
 */
export async function localizeRows<T extends Record<string, unknown>>(
  db: Db,
  entity: TranslatableEntity,
  rows: T[],
  locale: string | null | undefined,
  defaultLocale: string,
): Promise<Array<T & LocalizedMeta>> {
  const def = TRANSLATABLE[entity]
  if (!locale || sameLocale(locale, defaultLocale) || rows.length === 0) {
    return rows.map((r) => ({ ...r, _locale: defaultLocale, _translated: true, _baseSlug: (r.slug as string | null | undefined) ?? null }))
  }
  const chain = translationChain(locale, defaultLocale)
  const ids = [...new Set(rows.map((r) => r[def.idField]).filter((v) => v !== null && v !== undefined))]
  let trs: TranslationRow[] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any).from(def.table).select('*').in(def.fk, ids).in('locale', chain)
    if (error) throw error
    trs = (data ?? []) as TranslationRow[]
  } catch {
    trs = []
  }
  const byEntity = new Map<unknown, TranslationRow[]>()
  for (const t of trs) {
    const k = t[def.fk]
    const list = byEntity.get(k) ?? []
    list.push(t)
    byEntity.set(k, list)
  }
  return rows.map((r) => mergeTranslation(r, byEntity.get(r[def.idField]) ?? [], locale, defaultLocale, def.fields))
}

/** Una sola fila (atajo de `localizeRows`). */
export async function localizeRow<T extends Record<string, unknown>>(
  db: Db, entity: TranslatableEntity, row: T | null, locale: string | null | undefined, defaultLocale: string,
): Promise<(T & LocalizedMeta) | null> {
  if (!row) return null
  const [r] = await localizeRows(db, entity, [row], locale, defaultLocale)
  return r
}

/**
 * Resuelve el id/key de la entidad a partir de un slug TRADUCIDO (AC-4):
 * `/en-us/product/t-shirt` → id del producto. Busca en el locale y su idioma base.
 */
export async function findIdByTranslatedSlug(
  db: Db, entity: TranslatableEntity, slug: string, locale: string, defaultLocale: string,
): Promise<string | number | null> {
  const def = TRANSLATABLE[entity]
  const chain = translationChain(locale, defaultLocale)
  if (!chain.length || !slug) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any).from(def.table).select(`${def.fk}, locale`).eq('slug', slug).in('locale', chain)
    const rows = (data ?? []) as Record<string, unknown>[]
    for (const tag of chain) {
      const hit = rows.find((r) => r.locale === tag)
      if (hit) return hit[def.fk] as string | number
    }
  } catch { /* fail-safe */ }
  return null
}

/** Normaliza un slug traducido (minúsculas, sin acentos, guiones). */
export function slugifyTranslation(raw: string | null | undefined): string | null {
  const s = String(raw ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return s || null
}

/** Traducciones guardadas de una entidad (todas las lenguas) — editor HU-464. */
export async function listTranslations(db: Db, entity: TranslatableEntity, id: string | number): Promise<TranslationRow[]> {
  const def = TRANSLATABLE[entity]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).from(def.table).select('*').eq(def.fk, id).order('locale')
  if (error) throw new Error(error.message)
  return (data ?? []) as TranslationRow[]
}

/**
 * Crea o actualiza la traducción de una entidad en un locale. Solo acepta los
 * campos traducibles de la entidad; el slug se normaliza. Un objeto sin ningún
 * texto elimina la traducción.
 */
export async function saveTranslation(
  db: Db, tenantId: string, entity: TranslatableEntity, id: string | number, localeRaw: string, values: Record<string, unknown>,
): Promise<void> {
  const def = TRANSLATABLE[entity]
  const locale = normalizeLocale(localeRaw) ?? (['es', 'en'].includes(localeRaw) ? localeRaw : null)
  if (!locale) throw new Error('Idioma no soportado.')
  const row: Record<string, unknown> = { tenant_id: tenantId, [def.fk]: id, locale, updated_at: new Date().toISOString() }
  let any = false
  for (const f of def.fields) {
    if (!(f in values)) continue
    const v = f === 'slug' ? slugifyTranslation(values[f] as string) : (typeof values[f] === 'string' ? (values[f] as string).trim() || null : null)
    row[f] = v
    if (v) any = true
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).from(def.table)
  if (!any) {
    const { error } = await t.delete().eq(def.fk, id).eq('locale', locale)
    if (error) throw new Error(error.message)
    return
  }
  const conflict = entity === 'page' ? 'tenant_id,page_key,locale' : `${def.fk},locale`
  const { error } = await t.upsert(row, { onConflict: conflict })
  if (error?.code === '23505') throw new Error('Ese enlace (slug) ya está en uso en ese idioma.')
  if (error) throw new Error(error.message)
}
