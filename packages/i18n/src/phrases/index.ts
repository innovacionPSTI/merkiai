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

/** Traduce una frase del panel al idioma del locale (español: tal cual). */
export function translatePhrase(text: string, locale: string, values?: MessageValues): string {
  const key = phraseKey(text)
  const lang = baseLanguage(locale)
  const out = lang === 'es' ? key : PHRASES[lang]?.[key] ?? key
  if (!values) return out
  try { return formatMessage(out, values, locale) } catch { return out }
}
