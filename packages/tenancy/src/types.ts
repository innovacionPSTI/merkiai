/**
 * @merkiai/tenancy — tipos base del contexto multi-tenant.
 *
 * Estos tipos son el contrato del paquete; el resto de módulos (jwt, client,
 * context, factory) y sus consumidores dependen sólo de estos tipos, nunca de
 * una implementación concreta.
 */

/** Niveles de aislamiento de datos ofrecidos por plan (HU-173/HU-200). */
export type IsolationTier = 'shared' | 'schema' | 'dedicated'

/**
 * Registro de tenant (espejo del Team de Stack Auth). Vive en la BD de
 * plataforma (control plane), NUNCA en una BD de tenant.
 */
export interface TenantRecord {
  /** Identificador del tenant (= id del Team de Stack Auth). */
  tenantId: string
  /** Nivel de aislamiento según el plan. */
  tier: IsolationTier
  /**
   * Referencia de routing de base de datos. `null`/'shared' → BD compartida
   * (pooled + RLS). Otro valor → clave de un destino dedicado (schema o BD).
   */
  dbRef: string | null
}

/** Contexto de tenant resuelto para una petición. */
export interface TenantContext {
  /** Tenant activo (del host / Team activo). */
  tenantId: string
  /** Usuario autenticado (sub del JWT). */
  userId: string
}

/** Rol de Postgres embebido en el JWT. */
export type SupabaseRole = 'authenticated' | 'anon'

/** Claims del JWT de Supabase que consume la RLS. */
export interface TenantJwtClaims {
  /** Sujeto: id de usuario (o un id de sesión anónima para el storefront público). */
  sub: string
  /**
   * Rol de Postgres. `authenticated` para usuarios con sesión (cuenta, checkout);
   * `anon` para el storefront público (lectura de catálogo scoped por tenant).
   */
  role: SupabaseRole
  /** Claim que leen las políticas RLS: auth.jwt() ->> 'tenant_id'. */
  tenant_id: string
}
