'use server'

/** E28 · HU-466 · idioma de la consola del operador (cookie de larga duración). */
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { CONSOLE_LOCALE_COOKIE, CONSOLE_LOCALES } from '@/lib/ui-locale'
import { requirePlatformOperator } from '@/lib/platform-auth'

export async function setConsoleLocaleAction(locale: string): Promise<void> {
  await requirePlatformOperator()
  if (!(CONSOLE_LOCALES as readonly string[]).includes(locale)) return
  ;(await cookies()).set(CONSOLE_LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true })
  revalidatePath('/', 'layout')
}
