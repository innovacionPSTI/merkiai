/**
 * Contexto del editor de traducciones (E28 · HU-464): acceso a Contenido y los
 * idiomas publicados de la tienda (sin el por defecto, que es el contenido original).
 */
import { redirect } from 'next/navigation'
import { listMarkets, enabledLocales, storeDefaultLocale } from '@merkiai/database'
import { LOCALE_INFO, type Locale } from '@merkiai/i18n'
import { requireAdminDb } from './admin-context'
import { userCanAccess } from './roles'

export async function requireTranslations() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'contenido')) redirect('/no-autorizado')
  const markets = await listMarkets(db, adminUser.tenantId).catch(() => [])
  const defaultLocale = storeDefaultLocale(markets)
  const locales: string[] = enabledLocales(markets).filter((l) => l !== defaultLocale)
  return {
    adminUser, db, tenantId: adminUser.tenantId, defaultLocale, locales,
    localeOptions: locales.map((code) => ({ code, label: LOCALE_INFO[code as Locale]?.label ?? code })),
  }
}

export const TYPE_LABELS: Record<string, string> = {
  product: 'Productos', category: 'Categorías', blog_post: 'Blog', page: 'Páginas', blocks: 'Bloques del Constructor',
}
