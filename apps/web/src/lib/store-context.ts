/**
 * Contexto de tienda por request (HU-217).
 *
 * ÚNICA fuente de verdad del tenant activo y su "chrome" (config/nav/footer/tema).
 * Resuelve el tenant por host (RLS) y trae todo lo compartido UNA sola vez por
 * request gracias a `React.cache`: aunque lo llamen el root layout, el
 * `<StoreShell>` y varias páginas, la resolución + las queries corren una vez.
 *
 * Con esto el tenant-scoping del storefront vive en un solo lugar (imposible de
 * olvidar) y es la base reutilizable para el sistema de Templates: los datos
 * (repositorio + este contexto) son estables; solo cambia la presentación.
 */
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { MissingTenantContextError } from '@merkiai/tenancy'
import { getStoreConfig, getFooterPages, getNavTree, getActiveTheme } from '@merkiai/database'
import { getRequestCatalogDb } from './tenant-db'
import { resolveTenant } from './tenant-context'

export const getStoreContext = cache(async () => {
  const { tenantId, entitlements } = await resolveTenant()
  const db = await getRequestCatalogDb()
  const [config, footerPages, navItems, theme] = await Promise.all([
    getStoreConfig(db, tenantId).catch(() => null),
    getFooterPages(db).catch(() => []),
    getNavTree(db).catch(() => []),
    getActiveTheme(db).catch(() => null),
  ])
  return { tenantId, db, config, navItems, footerPages, theme, entitlements }
})

export type StoreContext = Awaited<ReturnType<typeof getStoreContext>>

/**
 * Igual que `getStoreContext`, pero traduce un tenant no resuelto (modo estricto
 * de HU-229 → `MissingTenantContextError`) en un **404 limpio** en vez de un 500.
 * Úsalo en las superficies del storefront (StoreShell, páginas). El root layout
 * puede seguir usando `getStoreContext().catch(...)` para degradar el chrome.
 */
export async function requireStoreContext(): Promise<StoreContext> {
  try {
    return await getStoreContext()
  } catch (e) {
    if (e instanceof MissingTenantContextError) notFound()
    throw e
  }
}
