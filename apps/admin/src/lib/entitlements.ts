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
/** Entitlements del plan (features + límites). Definición local para no acoplar
 *  el admin al paquete `@merkiai/tenancy` por una sola función. */
export interface PlanEntitlements {
  features: Record<string, boolean | string | number | null>
  limits: Record<string, number | null>
}

/** ¿`current` está dentro del límite `key`? (sin límite = permitido). */
export function withinLimit(ent: PlanEntitlements | null | undefined, key: string, current: number): boolean {
  const max = ent?.limits?.[key]
  if (max === null || max === undefined) return true
  return current < max
}

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export function getAdminTenantId(): string {
  return process.env.ADMIN_TENANT_ID ?? DEFAULT_TENANT_ID
}

export async function getTenantEntitlements(
  tenantId: string = getAdminTenantId(),
): Promise<{ tenantId: string; entitlements: PlanEntitlements | null }> {
  const base = process.env.CONTROL_PLANE_URL
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return { tenantId, entitlements: null }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/internal/tenants/${tenantId}`, {
      headers: { 'x-internal-secret': secret },
      cache: 'no-store',
    })
    if (!res.ok) return { tenantId, entitlements: null }
    const d = await res.json()
    return { tenantId, entitlements: (d?.entitlements as PlanEntitlements) ?? null }
  } catch {
    return { tenantId, entitlements: null }
  }
}
