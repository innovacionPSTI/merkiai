'use server'

/** E28 · HU-466 · guarda el idioma del panel del usuario (perfil + cookie). */
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@merkiai/database'
import { normalizeLocale } from '@merkiai/i18n'
import { getAdminUser } from '@/lib/auth'
import { ADMIN_LOCALE_COOKIE } from '@/lib/ui-locale'

export async function setAdminLocaleAction(raw: string): Promise<{ ok: boolean }> {
  const locale = normalizeLocale(raw)
  const user = await getAdminUser()
  if (!user || !locale) return { ok: false }
  ;(await cookies()).set(ADMIN_LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true })
  try {
    // Preferencia personal: se aplica a todos los perfiles de ese correo (sigue al usuario entre tiendas y equipos).
    await createServerClient().from('profiles').update({ ui_locale: locale } as never).eq('email', user.email)
  } catch { /* la cookie basta si la migración e17/81 aún no corre */ }
  revalidatePath('/', 'layout')
  return { ok: true }
}
