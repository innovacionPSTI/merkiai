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
import { getActiveInstance } from '@merkiai/database'

export async function requireMarkets() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'configuracion')) redirect('/no-autorizado')
  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId).catch(() => ({ entitlements: null }))
  const marketsEnabled = resolveFeature(entitlements, FEATURES.MARKETS)
  // HU-467 · la pasarela activa debe aceptar la moneda de cada mercado.
  const active = await getActiveInstance(db, adminUser.tenantId, 'payment').catch(() => null)
  return {
    adminUser,
    db,
    tenantId: adminUser.tenantId,
    rules: {
      maxLanguages: resolveLimit(entitlements, LIMITS.MAX_LANGUAGES),
      marketsEnabled,
      // HU-467 · multimoneda: feature del plan y requiere mercados.
      multiCurrency: marketsEnabled && resolveFeature(entitlements, FEATURES.MULTI_CURRENCY),
      activePaymentProvider: active?.provider ?? null,
    },
    priceListsEnabled: resolveFeature(entitlements, FEATURES.PRICE_LISTS),
  }
}
