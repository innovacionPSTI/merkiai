/**
 * Guards de entitlements para el plano de tienda (E17 · HU-173).
 *
 * Mecanismo reutilizable: deriva las features/límites del plan del tenant
 * (resueltos por host) y permite gatear en **UI** (ocultar) y en **API**
 * (autoritativo, 403). NO está cableado a ninguna feature todavía: cada módulo
 * (POS, dropshipping, IA…) aplicará su `requireFeature('<x>')` cuando exista.
 */
import { NextResponse } from 'next/server'
import { hasFeature, withinLimit, type PlanEntitlements } from '@merkiai/tenancy'
import { resolveTenant } from './tenant-context'

/** Entitlements del tenant actual (o null si no hay). */
export async function getTenantEntitlements(): Promise<PlanEntitlements | null> {
  const t = await resolveTenant()
  return t.entitlements ?? null
}

/** ¿El plan del tenant habilita `feature`? Para gating en UI (server components). */
export async function tenantHasFeature(feature: string): Promise<boolean> {
  return hasFeature(await getTenantEntitlements(), feature)
}

/**
 * Guard de API: devuelve un 403 si el plan NO habilita `feature`, o `null` si sí.
 * Uso: `const denied = await requireFeature('pos'); if (denied) return denied`.
 */
export async function requireFeature(feature: string): Promise<NextResponse | null> {
  if (await tenantHasFeature(feature)) return null
  return NextResponse.json(
    { error: 'feature_not_in_plan', feature },
    { status: 403 },
  )
}

/**
 * Guard de límite: 403 si `current` alcanzó el límite `key` del plan.
 * Uso: `const denied = await requireWithinLimit('products', count); if (denied) return denied`.
 */
export async function requireWithinLimit(key: string, current: number): Promise<NextResponse | null> {
  if (withinLimit(await getTenantEntitlements(), key, current)) return null
  return NextResponse.json(
    { error: 'plan_limit_reached', key },
    { status: 403 },
  )
}
