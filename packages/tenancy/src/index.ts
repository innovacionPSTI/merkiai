/**
 * @merkiai/tenancy — contexto multi-tenant, emisión de JWT con claim tenant_id,
 * clientes Supabase (plano de tienda vs control plane) y connection factory por
 * `db_ref`. Ver ADR-001 y `PRODUCT_BACKLOG.md → Detalle E17`.
 *
 * Estado: PoC del spike HU-171. No cablear a producción hasta cerrar el ADR.
 */
export type {
  IsolationTier,
  TenantRecord,
  TenantContext,
  TenantJwtClaims,
  SupabaseRole,
} from './types'

export { mintTenantJwt, verifyTenantJwt } from './jwt'
export type { MintTenantJwtParams } from './jwt'

export {
  MissingTenantContextError,
  normalizeHost,
  resolveTenantByHost,
  assertTenantContext,
} from './context'
export type { TenantResolver } from './context'

export { createTenantClient, createPlatformClient } from './client'
export type { TenantClientOptions, PlatformClientOptions } from './client'

export { resolveDbTarget, buildTenantClientOptions } from './factory'
export type { DbTarget, DbTargetRegistry } from './factory'

export type { IdentityProvider, IdentityUser } from './identity'

export { hasFeature, withinLimit, limitOf } from './entitlements'
export type { PlanEntitlements } from './entitlements'
