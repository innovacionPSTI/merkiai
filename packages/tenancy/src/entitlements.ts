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
  /** HU-281 · Matriz rol→secciones del admin por plan (solo roles de staff).
   *  Rol ausente/vacío → acceso por defecto del código. */
  roleAccess?: Record<string, string[]>
}

// ─── Catálogo de secciones del admin (HU-281) ────────────────────────────────
// Fuente compartida para el editor de planes (consola) y la validación. El tipo
// `AdminSection` del admin (apps/admin/src/lib/roles.ts) debe mantenerse en sync
// con estas claves.

export interface AdminSectionDef { key: string; label: string }

export const ADMIN_SECTIONS: AdminSectionDef[] = [
  { key: 'dashboard',     label: 'Panel' },
  { key: 'productos',     label: 'Productos' },
  { key: 'categorias',    label: 'Categorías' },
  { key: 'variantes',     label: 'Variantes' },
  { key: 'pedidos',       label: 'Pedidos' },
  { key: 'clientes',      label: 'Clientes' },
  { key: 'contenido',     label: 'Contenido' },
  { key: 'blog',          label: 'Blog' },
  { key: 'newsletter',    label: 'Newsletter' },
  { key: 'cupones',       label: 'Cupones' },
  { key: 'apariencia',    label: 'Apariencia' },
  { key: 'media',         label: 'Medios' },
  { key: 'configuracion', label: 'Configuración' },
  { key: 'usuarios',      label: 'Usuarios' },
  { key: 'sistema',       label: 'Sistema' },
  { key: 'ventas_vip',    label: 'Ventas VIP' },
]

/** Roles de STAFF cuyo acceso por secciones es configurable por plan. */
export const STAFF_ROLES = ['vendedor', 'gestor_tienda'] as const

/**
 * Secciones efectivas de un rol según el plan (HU-281). Pura.
 *  - Roles NO-staff (admin/super_admin): se devuelve `defaults` (acceso completo).
 *  - Roles staff: override del plan si trae lista no vacía (validada contra las
 *    secciones conocidas, 'dashboard' garantizado); si no, `defaults`.
 */
export function effectiveSectionsForRole(
  role: string,
  defaults: string[],
  roleAccess: Record<string, string[]> | undefined | null,
): string[] {
  if (!(STAFF_ROLES as readonly string[]).includes(role)) return defaults
  const override = roleAccess?.[role]
  if (!Array.isArray(override) || override.length === 0) return defaults
  const valid = new Set(ADMIN_SECTIONS.map((s) => s.key))
  const filtered = override.filter((s) => valid.has(s))
  if (!filtered.includes('dashboard')) filtered.unshift('dashboard')
  return filtered.length ? filtered : defaults
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
  /** E19 · Club VIP / acceso anticipado (segmentos + campañas VIP). */
  VIP_EARLY_ACCESS: 'vip_early_access',
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
  { key: FEATURES.VIP_EARLY_ACCESS, kind: 'feature', label: 'Club VIP / acceso anticipado', description: 'Segmentos de clientes y campañas de venta exclusiva por tiempo limitado.', default: false },
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
