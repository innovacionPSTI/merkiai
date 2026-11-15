/**
 * Idioma de la interfaz del panel (E28 · HU-466 AC-1/AC-2/AC-3).
 * Orden: preferencia del usuario (`profiles.ui_locale`) → cookie del navegador →
 * `Accept-Language` → es-CO. Independiente de los idiomas de la tienda y sin
 * cambiar las URLs del panel.
 */
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { createServerClient } from '@merkiai/database'
import { normalizeLocale, matchAcceptLanguage, DEFAULT_LOCALE, createTranslator } from '@merkiai/i18n'
import { stackServerApp } from '../stack'

export const ADMIN_LOCALE_COOKIE = 'merkiai_admin_locale'

/** Preferencia guardada del usuario (fail-safe: null si la columna aún no existe). */
async function profileLocale(email: string): Promise<string | null> {
  try {
    const { data } = await createServerClient().from('profiles').select('ui_locale').eq('email', email).not('ui_locale', 'is', null).limit(1)
    return normalizeLocale((data?.[0] as { ui_locale?: string } | undefined)?.ui_locale ?? null)
  } catch {
    return null
  }
}

export const getAdminLocale = cache(async (): Promise<string> => {
  const user = await stackServerApp.getUser().catch(() => null)
  if (user?.primaryEmail) {
    const pref = await profileLocale(user.primaryEmail)
    if (pref) return pref
  }
  const fromCookie = normalizeLocale((await cookies()).get(ADMIN_LOCALE_COOKIE)?.value ?? null)
  if (fromCookie) return fromCookie
  return matchAcceptLanguage((await headers()).get('accept-language')) ?? DEFAULT_LOCALE
})

/** Traductor del panel para Server Components. */
export async function getAdminT(namespace?: string) {
  return createTranslator(await getAdminLocale(), namespace)
}
