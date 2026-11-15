/**
 * Locales soportados por la plataforma (HU-460 · ADR-011).
 *
 * Etiquetas BCP 47 `idioma-REGIÓN`. La lista es cerrada y ampliable: agregar un
 * locale = agregarlo aquí + su catálogo de sobrescrituras (opcional). Ningún
 * mercado es prioritario; `DEFAULT_LOCALE` solo preserva el comportamiento actual.
 */

export const SUPPORTED_LOCALES = ['es-CO', 'es-MX', 'es-ES', 'en-US'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** Idiomas base (catálogo completo); los locales solo sobrescriben diferencias. */
export const BASE_LANGUAGES = ['es', 'en'] as const
export type BaseLanguage = (typeof BASE_LANGUAGES)[number]

/** Locale por defecto de la plataforma (comportamiento histórico: español de Colombia). */
export const DEFAULT_LOCALE: Locale = 'es-CO'

/** Idioma base con el catálogo completo de referencia (lo exige el guard de CI). */
export const REFERENCE_LANGUAGE: BaseLanguage = 'es'

/** Metadatos visibles (selector de idioma). El nombre va en su propio idioma. */
export const LOCALE_INFO: Record<Locale, { label: string; country: string; language: BaseLanguage }> = {
  'es-CO': { label: 'Español (Colombia)', country: 'CO', language: 'es' },
  'es-MX': { label: 'Español (México)', country: 'MX', language: 'es' },
  'es-ES': { label: 'Español (España)', country: 'ES', language: 'es' },
  'en-US': { label: 'English (United States)', country: 'US', language: 'en' },
}

const BY_LOWER = new Map<string, Locale>(SUPPORTED_LOCALES.map((l) => [l.toLowerCase(), l]))

/**
 * Normaliza cualquier escritura (`es-mx`, `es_MX`, `ES-mx`) a la forma canónica
 * soportada (`es-MX`). `null` si no es un locale soportado.
 */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null
  const key = String(raw).trim().replace('_', '-').toLowerCase()
  return BY_LOWER.get(key) ?? null
}

export function isSupportedLocale(raw: unknown): raw is Locale {
  return typeof raw === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(raw)
}

/** Idioma base de un locale (`es-MX` → `es`). */
export function baseLanguage(locale: string): string {
  return String(locale).split(/[-_]/)[0].toLowerCase()
}

/** Segmento de URL del locale: minúsculas (`es-MX` → `es-mx`). El `hreflang` usa la forma canónica. */
export function localeToPathSegment(locale: Locale): string {
  return locale.toLowerCase()
}

/** Inverso de `localeToPathSegment`: `es-mx` → `es-MX` (o `null`). */
export function pathSegmentToLocale(segment: string | null | undefined): Locale | null {
  return normalizeLocale(segment)
}

/**
 * Cadena de resolución: el locale y luego su idioma base (`es-MX` → [`es-MX`, `es`]).
 * Si el idioma base no es el de referencia, se añade la referencia al final como
 * último recurso (nunca se muestra una clave vacía si existe en español).
 */
export function localeChain(locale: string): string[] {
  const chain: string[] = []
  const canonical = normalizeLocale(locale) ?? locale
  if (canonical.includes('-')) chain.push(canonical)
  const base = baseLanguage(canonical)
  chain.push(base)
  if (base !== REFERENCE_LANGUAGE) chain.push(REFERENCE_LANGUAGE)
  return [...new Set(chain)]
}

/**
 * Elige el mejor locale soportado para una cabecera `Accept-Language`
 * (p. ej. `es-AR,es;q=0.9,en;q=0.8`), restringido a `allowed`. Coincidencia exacta
 * primero; luego por idioma base (el primer locale permitido de ese idioma).
 * Solo para SUGERIR (ADR-011: no hay redirección automática).
 */
export function matchAcceptLanguage(header: string | null | undefined, allowed: readonly Locale[] = SUPPORTED_LOCALES): Locale | null {
  if (!header || allowed.length === 0) return null
  const prefs = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) || 0 : 1 }
    })
    .filter((p) => p.tag && p.tag !== '*' && p.q > 0)
    .sort((a, b) => b.q - a.q)
  for (const { tag } of prefs) {
    const exact = normalizeLocale(tag)
    if (exact && allowed.includes(exact)) return exact
    const base = baseLanguage(tag)
    const byBase = allowed.find((l) => baseLanguage(l) === base)
    if (byBase) return byBase
  }
  return null
}
