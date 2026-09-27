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

// ─── Catálogo canónico de entitlements (HU-239) ──────────────────────────────
// Fuente ÚNICA de verdad de todas las claves de features/limits. La usan el
// editor de Planes de la consola (para pintar toggles/inputs), el gating del
// admin/wizard/Constructor y el enforcement server-side. Prohibido usar strings
// sueltos: referenciar siempre `FEATURES`/`LIMITS`.

export type EntitlementKind = 'feature' | 'limit'

export interface EntitlementDef {
  key: string
  kind: EntitlementKind
  /** Etiqueta corta para UI (editor de planes, upsell). */
  label: string
  description: string
  /** Valor por defecto si el plan no lo declara. feature→boolean; limit→number|null (null=ilimitado). */
  default: boolean | number | null
}

/** Claves de funcionalidad (booleanas). */
export const FEATURES = {
  CUSTOM_DOMAIN: 'custom_domain',
  MULTI_LOCATION: 'multi_location',
  AI_DESIGN: 'ai_design',
  PAGE_BUILDER: 'page_builder',
} as const

/** Claves de límite (cuantitativas; null = ilimitado). */
export const LIMITS = {
  PRODUCTS: 'products',
  USERS: 'users',
  CATEGORIES: 'categories',
  LOCATIONS: 'locations',
  ORDERS_MONTH: 'orders_month',
  AI_GENERATIONS_MONTH: 'ai_generations_month',
} as const

export const ENTITLEMENTS_CATALOG: EntitlementDef[] = [
  { key: FEATURES.CUSTOM_DOMAIN,  kind: 'feature', label: 'Dominio propio',            description: 'Conectar un dominio propio además del subdominio *.merkiai.com.', default: false },
  { key: FEATURES.MULTI_LOCATION, kind: 'feature', label: 'Sucursales (multi-ubicación)', description: 'Inventario por ubicación, fulfillment por sucursal, click & collect.', default: false },
  { key: FEATURES.AI_DESIGN,      kind: 'feature', label: 'Diseño por IA',             description: 'Generar el diseño/contenido de la tienda con IA.',              default: false },
  { key: FEATURES.PAGE_BUILDER,   kind: 'feature', label: 'Constructor de páginas',    description: 'Editor visual de páginas por bloques.',                        default: false },
  { key: LIMITS.PRODUCTS,             kind: 'limit', label: 'Productos',            description: 'Máximo de productos publicables.',        default: null },
  { key: LIMITS.USERS,                kind: 'limit', label: 'Usuarios del panel',   description: 'Máximo de usuarios del admin.',           default: null },
  { key: LIMITS.CATEGORIES,           kind: 'limit', label: 'Categorías',           description: 'Máximo de categorías.',                   default: null },
  { key: LIMITS.LOCATIONS,            kind: 'limit', label: 'Sucursales',           description: 'Máximo de ubicaciones (requiere multi_location).', default: null },
  { key: LIMITS.ORDERS_MONTH,         kind: 'limit', label: 'Pedidos por mes',      description: 'Máximo de pedidos mensuales.',            default: null },
  { key: LIMITS.AI_GENERATIONS_MONTH, kind: 'limit', label: 'Generaciones IA/mes',  description: 'Máximo de generaciones de diseño IA al mes.', default: null },
]

export function entitlementDef(key: string): EntitlementDef | undefined {
  return ENTITLEMENTS_CATALOG.find((e) => e.key === key)
}

/** Feature resuelta: valor del plan, o el default del catálogo si no lo declara. */
export function resolveFeature(ent: PlanEntitlements | null | undefined, key: string): boolean {
  const v = ent?.features?.[key]
  if (v === undefined || v === null) return Boolean(entitlementDef(key)?.default)
  return Boolean(v)
}

/** Límite resuelto: valor del plan, o el default del catálogo. null = ilimitado. */
export function resolveLimit(ent: PlanEntitlements | null | undefined, key: string): number | null {
  const v = ent?.limits?.[key]
  if (v === undefined) {
    const d = entitlementDef(key)?.default
    return typeof d === 'number' ? d : null
  }
  return typeof v === 'number' ? v : null
}

/** Error de entitlement — los bordes API lo mapean a 402/403 con `key`/`kind`. */
export class EntitlementError extends Error {
  readonly code = 'ENTITLEMENT'
  constructor(
    readonly kind: EntitlementKind,
    readonly key: string,
    message: string,
    readonly meta?: { limit?: number; current?: number },
  ) {
    super(message)
    this.name = 'EntitlementError'
  }
}

/** Enforcement server-side: lanza `EntitlementError` si el plan no habilita la feature. */
export function requireFeature(ent: PlanEntitlements | null | undefined, key: string): void {
  if (!resolveFeature(ent, key)) {
    throw new EntitlementError('feature', key, `Tu plan no incluye: ${entitlementDef(key)?.label ?? key}.`)
  }
}

/** Enforcement server-side: lanza si `current` alcanza/supera el límite del plan. */
export function enforceLimit(ent: PlanEntitlements | null | undefined, key: string, current: number): void {
  const max = resolveLimit(ent, key)
  if (max !== null && current >= max) {
    throw new EntitlementError('limit', key, `Alcanzaste el límite de ${entitlementDef(key)?.label ?? key} de tu plan (${max}).`, { limit: max, current })
  }
}
