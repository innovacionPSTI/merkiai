/**
 * Entitlements por plan (E17 · HU-173). Funciones puras que derivan permisos de
 * funcionalidad y límites a partir del plan del tenant. Se aplican en 3 capas:
 * UI (ocultar), API (`requireEntitlement`, autoritativo) y datos (RLS, aislamiento).
 */

export interface PlanEntitlements {
  /** Funcionalidades habilitadas por el plan. */
  features: Record<string, boolean | string | number | null>
  /** Límites cuantitativos (null/undefined = ilimitado). */
  limits: Record<string, number | null>
}

/** ¿El plan habilita la funcionalidad `feature`? */
export function hasFeature(ent: PlanEntitlements | null | undefined, feature: string): boolean {
  return Boolean(ent?.features?.[feature])
}

/** ¿`current` está dentro del límite `key`? (sin límite definido = permitido). */
export function withinLimit(
  ent: PlanEntitlements | null | undefined,
  key: string,
  current: number,
): boolean {
  const max = ent?.limits?.[key]
  if (max === null || max === undefined) return true
  return current < max
}

/** Límite declarado para `key`, o null si es ilimitado. */
export function limitOf(ent: PlanEntitlements | null | undefined, key: string): number | null {
  const max = ent?.limits?.[key]
  return typeof max === 'number' ? max : null
}
