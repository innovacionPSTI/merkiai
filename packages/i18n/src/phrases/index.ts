/**
 * Frases de interfaz con clave = texto original en español (E28 · HU-466).
 *
 * Para la "cola larga" de textos del panel y la consola (cientos de etiquetas y
 * ayudas) se usa el estilo gettext: el texto en español es la clave y cada
 * idioma base tiene un diccionario. Las pantallas de alto tráfico (tienda,
 * checkout, correos, navegación) siguen con claves semánticas en `catalogs/`.
 * Sin entrada → se muestra el original (nunca vacío). `pnpm i18n:check` reporta
 * la cobertura de este diccionario.
 */
import { formatMessage, type MessageValues } from '../icu'
import { baseLanguage } from '../locales'
import adminEn from './admin.en'

export const PHRASES: Record<string, Record<string, string>> = {
  en: adminEn,
}

/** Normaliza espacios como JSX (para que la clave coincida con el texto renderizado). */
export function phraseKey(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Entradas con huecos posicionales (`{0}`, `{1}`…) para mensajes armados en runtime. */
const PATTERNS: Record<string, Array<{ re: RegExp; out: string }>> = {}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function patternsFor(lang: string): Array<{ re: RegExp; out: string }> {
  if (PATTERNS[lang]) return PATTERNS[lang]
  const dict = PHRASES[lang] ?? {}
  const list = Object.entries(dict)
    .filter(([k]) => /\{\d+\}/.test(k))
    // Más texto fijo primero: la entrada más específica gana.
    .sort(([a], [b]) => b.replace(/\{\d+\}/g, '').length - a.replace(/\{\d+\}/g, '').length)
    .map(([k, out]) => ({ re: new RegExp('^' + k.split(/(\{\d+\})/).map((part) => (/^\{\d+\}$/.test(part) ? `(?<p${part.slice(1, -1)}>[\\s\\S]*?)` : escapeRe(part))).join('') + '$'), out }))
  PATTERNS[lang] = list
  return list
}

/**
 * Busca la frase en el diccionario: primero exacta y luego por patrón con
 * huecos `{0}` (p. ej. "Documento {0} creado." traduce "Documento F-12 creado.").
 */
function lookup(key: string, lang: string): string {
  const dict = PHRASES[lang]
  if (!dict) return key
  const exact = dict[key]
  if (exact !== undefined) return exact
  for (const { re, out } of patternsFor(lang)) {
    const m = re.exec(key)
    if (m) return out.replace(/\{(\d+)\}/g, (_, n: string) => m.groups?.[`p${n}`] ?? '')
  }
  return key
}

/** Traduce una frase del panel al idioma del locale (español: tal cual). */
export function translatePhrase(text: string, locale: string, values?: MessageValues): string {
  const key = phraseKey(text)
  const lang = baseLanguage(locale)
  const out = lang === 'es' ? key : lookup(key, lang)
  if (!values) return out
  try { return formatMessage(out, values, locale) } catch { return out }
}

const MESSAGE_FIELDS = ['error', 'message', 'warning', 'notice'] as const
const MESSAGE_LISTS = ['errors', 'warnings'] as const

/**
 * Traduce los mensajes de una respuesta de API o de una server action
 * (`error`, `message`, `warning`, `notice` y las listas `errors`/`warnings`).
 * No toca el resto de los datos. Español o sin mensajes → el mismo objeto.
 */
export function localizeMessages<T>(body: T, locale: string): T {
  if (baseLanguage(locale) === 'es' || !body || typeof body !== 'object' || Array.isArray(body)) return body
  const src = body as Record<string, unknown>
  let out: Record<string, unknown> | null = null
  const set = (k: string, v: unknown) => { out ??= { ...src }; out[k] = v }
  for (const k of MESSAGE_FIELDS) {
    if (typeof src[k] === 'string') set(k, translatePhrase(src[k] as string, locale))
  }
  for (const k of MESSAGE_LISTS) {
    const list = src[k]
    if (Array.isArray(list)) {
      set(k, list.map((e) => (typeof e === 'string' ? translatePhrase(e, locale)
        : e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string'
          ? { ...(e as object), message: translatePhrase((e as { message: string }).message, locale) } : e)))
    }
  }
  return (out ?? body) as T
}

/** ¿El cuerpo trae algún mensaje traducible? (evita trabajo en respuestas de datos). */
export function hasMessages(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  const src = body as Record<string, unknown>
  return MESSAGE_FIELDS.some((k) => typeof src[k] === 'string') || MESSAGE_LISTS.some((k) => Array.isArray(src[k]))
}
