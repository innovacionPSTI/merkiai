/**
 * Entitlements del tenant del admin (HU-173). Consulta el control plane
 * (`/api/internal/tenants/{id}`) para obtener features/limits del plan.
 *
 * Nota (interino): mientras el admin es single-tenant, el tenant se toma de
 * `ADMIN_TENANT_ID` (default = tenant por defecto). HU-158 lo reemplaza por el
 * tenant del **team del operador** logueado.
 *
 * Los límites son una **regla de negocio**, no una frontera de seguridad: si el
 * control plane no está configurado o no responde, se devuelve `null` y NO se
 * bloquea (fail-open intencional, a diferencia de la RLS que es fail-closed).
 */
// HU-239: el modelo de entitlements y el gating viven en @merkiai/tenancy
// (catálogo canónico único). Aquí solo se re-exportan + la consulta al control
// plane, específica del admin.
import { getActiveTenantId } from './active-tenant'
import type { PlanEntitlements } from '@merkiai/tenancy'
import { consoleUrl } from './console-url'
import { featureAllowed as featureAllowedImpl, entitlementDef as entitlementDefImpl } from '@merkiai/tenancy'

export type { PlanEntitlements, EntitlementDef, EntitlementKind } from '@merkiai/tenancy'
export {
  hasFeature, withinLimit, limitOf,
  resolveFeature, resolveLimit, featureAllowed,
  requireFeature, enforceLimit,
  EntitlementError, entitlementDef,
  ENTITLEMENTS_CATALOG, FEATURES, LIMITS,
} from '@merkiai/tenancy'

export async function getTenantEntitlements(
  tenantId?: string,
): Promise<{ tenantId: string; entitlements: PlanEntitlements | null; status: string | null }> {
  // HU-158: el tenant sale del **tenant activo** (cookie del workspace elegido);
  // fallback al por defecto (single-tenant interino).
  const tid = tenantId ?? (await getActiveTenantId())
  return fetchEntitlements(tid)
}

async function fetchEntitlements(tenantId: string): Promise<{ tenantId: string; entitlements: PlanEntitlements | null; status: string | null }> {
  const base = consoleUrl()
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return { tenantId, entitlements: null, status: null }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/internal/tenants/${tenantId}`, {
      headers: { 'x-internal-secret': secret },
      cache: 'no-store',
    })
    if (!res.ok) return { tenantId, entitlements: null, status: null }
    const d = await res.json()
    return {
      tenantId,
      entitlements: (d?.entitlements as PlanEntitlements) ?? null,
      // HU-194 · estado del tenant (activo/suspendido…) para el gate del admin.
      status: (d?.status as string | undefined) ?? null,
    }
  } catch {
    return { tenantId, entitlements: null, status: null }
  }
}

/**
 * HU-359 · gating server-side de una capacidad del Constructor que el plan puede
 * apagar (ver `featureAllowed`). Devuelve el mensaje si está apagada; null si se
 * permite (también sin control-plane: fail-open).
 */
export async function featureDeniedMessage(tenantId: string, key: string): Promise<string | null> {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (!entitlements) return null
  return featureAllowedImpl(entitlements, key) ? null : `Tu plan no incluye: ${entitlementDefImpl(key)?.label ?? key}.`
}
