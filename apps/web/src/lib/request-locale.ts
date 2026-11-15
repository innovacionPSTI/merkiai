/**
 * Locale de la petición del storefront (E28 · HU-463/462).
 *
 * El middleware de HU-462 resolverá el locale (prefijo/dominio del mercado) y lo
 * pasará en la cabecera `x-locale`. Mientras no exista, la petición se sirve en
 * el idioma por defecto: `locale = null` → las funciones de localización no
 * consultan la BD (cero costo y cero cambio visible).
 */
import { cache } from 'react'
import { headers } from 'next/headers'
import { normalizeLocale, DEFAULT_LOCALE } from '@merkiai/i18n'
import {
  listMarkets, storeDefaultLocale, localizeRows, findIdByTranslatedSlug, type TranslatableEntity, type Db,
} from '@merkiai/database'
import { resolveTenant } from './tenant-context'
import { getMachineDb } from './machine-db'

export interface RequestLocale {
  /** Locale pedido si difiere del por defecto de la tienda; `null` = idioma por defecto. */
  locale: string | null
  defaultLocale: string
}

export const getRequestLocale = cache(async (): Promise<RequestLocale> => {
  const raw = (await headers()).get('x-locale')
  const locale = normalizeLocale(raw)
  if (!locale) return { locale: null, defaultLocale: DEFAULT_LOCALE }
  try {
    const { tenantId } = await resolveTenant()
    const defaultLocale = storeDefaultLocale(await listMarkets(getMachineDb(tenantId), tenantId))
    return { locale: locale === defaultLocale ? null : locale, defaultLocale }
  } catch {
    return { locale: null, defaultLocale: DEFAULT_LOCALE }
  }
})

/** Localiza filas de una entidad con el locale de la petición (no-op en el idioma por defecto). */
export async function localize<T>(db: Db, entity: TranslatableEntity, rows: T[]): Promise<T[]> {
  const { locale, defaultLocale } = await getRequestLocale()
  if (!locale || rows.length === 0) return rows
  return (await localizeRows(db, entity, rows as unknown as Record<string, unknown>[], locale, defaultLocale)) as unknown as T[]
}

export async function localizeOne<T>(db: Db, entity: TranslatableEntity, row: T | null): Promise<T | null> {
  if (!row) return null
  const [r] = await localize(db, entity, [row])
  return r
}

/**
 * Slug de la URL → slug base de la entidad (AC-4). Si el slug pedido es una
 * traducción del locale activo, devuelve el slug original para buscar la fila.
 */
export async function resolveBaseSlug(db: Db, entity: 'product' | 'blog_post', slug: string): Promise<string | null> {
  const { locale, defaultLocale } = await getRequestLocale()
  if (!locale) return null
  const id = await findIdByTranslatedSlug(db, entity, slug, locale, defaultLocale)
  if (id === null) return null
  const table = entity === 'product' ? 'products' : 'blog_posts'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any).from(table).select('slug').eq('id', id).maybeSingle()
  return (data?.slug as string | undefined) ?? null
}
