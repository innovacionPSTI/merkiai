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

import { getActiveTenantId } from './active-tenant'

export async function getTenantEntitlements(
  tenantId?: string,
): Promise<{ tenantId: string; entitlements: PlanEntitlements | null }> {
  // HU-158: el tenant sale del **tenant activo** (cookie del workspace elegido);
  // fallback al por defecto (single-tenant interino).
  const tid = tenantId ?? (await getActiveTenantId())
  return fetchEntitlements(tid)
}

async function fetchEntitlements(tenantId: string): Promise<{ tenantId: string; entitlements: PlanEntitlements | null }> {
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
