/**
 * Enrutamiento del storefront por idioma (E28 · HU-462 · ADR-011 §2.5). PURO.
 *
 *  - Subcarpeta en minúsculas: `/es-mx/…`, `/en-us/…` (el `hreflang` usa `es-MX`).
 *  - El locale por defecto (de la tienda, o del dominio de un mercado) va SIN
 *    prefijo; pedirlo con prefijo responde 301 a la URL sin prefijo.
 *  - Un dominio ligado a un mercado sirve el locale de ese mercado sin prefijo.
 *  - Sin redirección por `Accept-Language` (solo se sugiere en la UI). La cookie
 *    `merkiai_locale` (elección explícita del visitante) sí lleva a la versión
 *    elegida; los buscadores no envían cookies y reciben la URL pedida.
 *  - Con un solo locale no cambia nada (ni prefijos ni hreflang).
 */
import { normalizeLocale, localeToPathSegment, type Locale } from '@merkiai/i18n'

export const LOCALE_COOKIE = 'merkiai_locale'

export interface LocaleConfig {
  /** Locale por defecto de la tienda (mercado por defecto). */
  defaultLocale: string
  /** Locales publicables (mercados activos), incluido el por defecto. */
  locales: string[]
  /** Dominios propios ligados a un mercado → locale que sirven sin prefijo. */
  domains: Array<{ domain: string; locale: string }>
}

export type LocaleRoute =
  /** Seguir con la petición. `locale` es el efectivo (null = por defecto de la tienda). */
  | { kind: 'pass'; locale: string | null }
  /** Servir `path` (sin prefijo) con el locale indicado. */
  | { kind: 'rewrite'; path: string; locale: string }
  | { kind: 'redirect'; location: string; status: 301 | 307 }

const SEG = /^\/([a-z]{2}-[a-z]{2})(\/.*)?$/

/** Locale que un host sirve sin prefijo. */
export function hostDefaultLocale(host: string, config: LocaleConfig): string {
  const h = host.toLowerCase().replace(/:\d+$/, '')
  return config.domains.find((d) => d.domain === h)?.locale ?? config.defaultLocale
}

/**
 * Decide qué hacer con una petición de PÁGINA (el llamador excluye /api, /_next,
 * /handler y archivos). `search` se conserva en las redirecciones.
 */
export function resolveLocaleRoute(input: {
  pathname: string
  search?: string
  host: string
  cookieLocale?: string | null
  config: LocaleConfig
}): LocaleRoute {
  const { pathname, search = '', host, config } = input
  if (config.locales.length <= 1) return { kind: 'pass', locale: null }
  const hostDefault = hostDefaultLocale(host, config)
  const effective = (l: string) => (l === config.defaultLocale ? null : l)

  const m = SEG.exec(pathname)
  const prefixed = m ? normalizeLocale(m[1]) : null
  if (prefixed && config.locales.includes(prefixed)) {
    const rest = m![2] && m![2] !== '/' ? m![2] : '/'
    if (prefixed === hostDefault) return { kind: 'redirect', location: rest + search, status: 301 }
    return { kind: 'rewrite', path: rest, locale: prefixed }
  }

  const cookie = normalizeLocale(input.cookieLocale)
  if (cookie && cookie !== hostDefault && config.locales.includes(cookie)) {
    return { kind: 'redirect', location: localizedPath(pathname, cookie, host, config) + search, status: 307 }
  }
  return { kind: 'pass', locale: effective(hostDefault) }
}

/** Ruta (sin origen) de `path` en `locale` para el host actual. */
export function localizedPath(path: string, locale: string, host: string, config: LocaleConfig): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === hostDefaultLocale(host, config)) return clean
  const seg = localeToPathSegment(locale as Locale)
  return clean === '/' ? `/${seg}` : `/${seg}${clean}`
}

/** URL absoluta de `path` en `locale` (usa el dominio del mercado si el locale lo tiene). */
export function localizedUrl(path: string, locale: string, origin: string, config: LocaleConfig): string {
  const domain = config.domains.find((d) => d.locale === locale)
  if (domain) {
    const proto = origin.startsWith('http://') ? 'http' : 'https'
    return `${proto}://${domain.domain}${path === '/' ? '' : path}`
  }
  const host = origin.replace(/^https?:\/\//, '')
  const p = localizedPath(path, locale, host, config)
  return `${origin}${p === '/' ? '' : p}`
}

/**
 * `alternates` de Next (canónica + hreflang) para una ruta SIN prefijo.
 * `available` limita las versiones a las que tienen contenido propio (AC-3);
 * el locale por defecto siempre está. Con un solo locale: solo la canónica.
 */
export function buildAlternates(input: {
  /** Ruta sin prefijo, o función por locale (slugs traducidos). */
  path: string | ((locale: string) => string)
  origin: string
  currentLocale: string | null
  config: LocaleConfig
  available?: string[] | null
}): { canonical: string; languages?: Record<string, string> } {
  const { origin, config } = input
  const pathOf = (l: string) => (typeof input.path === 'function' ? input.path(l) : input.path)
  const current = input.currentLocale ?? config.defaultLocale
  const canonical = localizedUrl(pathOf(current), current, origin, config)
  if (config.locales.length <= 1) return { canonical }
  const versions = config.locales.filter((l) => l === config.defaultLocale || !input.available || input.available.includes(l))
  if (versions.length <= 1) return { canonical }
  const languages: Record<string, string> = {}
  for (const l of versions) languages[l] = localizedUrl(pathOf(l), l, origin, config)
  languages['x-default'] = localizedUrl(pathOf(config.defaultLocale), config.defaultLocale, origin, config)
  return { canonical, languages }
}
