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
  listMarkets, storeDefaultLocale, enabledLocales, localizeRows, findIdByTranslatedSlug, translationIndex, availableLocales, slugForLocale,
  type TranslatableEntity, type Db,
} from '@merkiai/database'
import { buildAlternates, localizedPath, type LocaleConfig } from './locale-routing'
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
  let id = locale ? await findIdByTranslatedSlug(db, entity, slug, locale, defaultLocale) : null
  if (id === null) {
    // Slug traducido de OTRO idioma (p. ej. cambio de idioma en el selector):
    // se resuelve igual y la página redirige al slug correcto (HU-462).
    const table = entity === 'product' ? 'product_translations' : 'blog_post_translations'
    const fk = entity === 'product' ? 'product_id' : 'post_id'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any).from(table).select(fk).eq('slug', slug).limit(1)
    id = (data?.[0]?.[fk] as number | undefined) ?? null
  }
  if (id === null) return null
  const table = entity === 'product' ? 'products' : 'blog_posts'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any).from(table).select('slug').eq('id', id).maybeSingle()
  return (data?.slug as string | undefined) ?? null
}

/** Configuración de idiomas de la tienda (mercados), una vez por petición. */
export const getLocaleConfig = cache(async (): Promise<LocaleConfig> => {
  try {
    const { tenantId } = await resolveTenant()
    const markets = await listMarkets(getMachineDb(tenantId), tenantId)
    return {
      defaultLocale: storeDefaultLocale(markets),
      locales: enabledLocales(markets),
      domains: markets.filter((m) => m.active && m.domain).map((m) => ({ domain: m.domain as string, locale: m.default_locale })),
    }
  } catch {
    return { defaultLocale: DEFAULT_LOCALE, locales: [DEFAULT_LOCALE], domains: [] }
  }
})

/** Locale efectivo de la página (para `<html lang>`): el de la petición o el por defecto. */
export async function getPageLang(): Promise<string> {
  const raw = normalizeLocale((await headers()).get('x-locale'))
  return raw ?? (await getLocaleConfig()).defaultLocale
}

async function origin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : ''
}

/**
 * `metadata.alternates` (canónica + hreflang + x-default) para una ruta SIN prefijo
 * (HU-462 AC-3/AC-4). Para contenido traducible, pasar la entidad: solo se anuncian
 * los idiomas con traducción propia. Con un solo idioma devuelve solo la canónica.
 */
export async function alternatesFor(
  path: string | ((slug: string) => string),
  entity?: { type: TranslatableEntity; id: string | number; db: Db; baseSlug?: string },
) {
  const config = await getLocaleConfig()
  const current = normalizeLocale((await headers()).get('x-locale'))
  let available: string[] | null = null
  let pathOf: string | ((locale: string) => string) = typeof path === 'string' ? path : path(entity?.baseSlug ?? '')
  if (entity && config.locales.length > 1) {
    const index = await translationIndex(entity.db, entity.type, entity.id)
    available = availableLocales(index.map((r) => r.locale), config.locales, config.defaultLocale)
    if (typeof path === 'function' && entity.baseSlug) {
      const base = entity.baseSlug
      pathOf = (l: string) => path(l === config.defaultLocale ? base : slugForLocale(index, l, base))
    }
  }
  return buildAlternates({ path: pathOf, origin: await origin(), currentLocale: current, config, available })
}

/** Ruta con el prefijo del idioma de la petición (enlaces y redirecciones canónicas). */
export async function pathInRequestLocale(path: string): Promise<string> {
  const config = await getLocaleConfig()
  const current = normalizeLocale((await headers()).get('x-locale'))
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase().replace(/:\d+$/, '')
  return current ? localizedPath(path, current, host, config) : path
}
