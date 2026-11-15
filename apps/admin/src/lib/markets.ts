/**
 * Contexto de "Idiomas y mercados" (E28 · HU-461) para la página y las acciones.
 * Exige acceso a Configuración con rol administrador (como Pagos/Envíos) y deriva
 * las reglas del plan: `max_idiomas` (límite) y `markets` (más de un mercado).
 */
import { redirect } from 'next/navigation'
import { requireAdminDb } from './admin-context'
import { userCanAccess } from './roles'
import { getTenantEntitlements } from './entitlements'
import { resolveFeature, resolveLimit, FEATURES, LIMITS } from '@merkiai/tenancy'

export async function requireMarkets() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')
  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId).catch(() => ({ entitlements: null }))
  return {
    adminUser,
    db,
    tenantId: adminUser.tenantId,
    rules: {
      maxLanguages: resolveLimit(entitlements, LIMITS.MAX_LANGUAGES),
      marketsEnabled: resolveFeature(entitlements, FEATURES.MARKETS),
    },
    priceListsEnabled: resolveFeature(entitlements, FEATURES.PRICE_LISTS),
  }
}
