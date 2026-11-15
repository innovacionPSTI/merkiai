/**
 * Idioma de la consola (E28 · HU-466 AC-5): español o inglés, por operador.
 * Cookie del navegador → `Accept-Language` → es-CO. Sin cambio de URLs.
 */
import { cookies, headers } from 'next/headers'
import { normalizeLocale, matchAcceptLanguage, DEFAULT_LOCALE } from '@merkiai/i18n'

export const CONSOLE_LOCALE_COOKIE = 'merkiai_console_locale'
/** La consola es de uso interno: español e inglés. */
export const CONSOLE_LOCALES = ['es-CO', 'en-US'] as const

export async function getConsoleLocale(): Promise<string> {
  const c = normalizeLocale((await cookies()).get(CONSOLE_LOCALE_COOKIE)?.value ?? null)
  if (c && (CONSOLE_LOCALES as readonly string[]).includes(c)) return c
  return matchAcceptLanguage((await headers()).get('accept-language'), [...CONSOLE_LOCALES]) ?? DEFAULT_LOCALE
}
