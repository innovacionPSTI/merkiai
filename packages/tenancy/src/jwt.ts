/**
 * Emisión y verificación del JWT de Supabase con el claim `tenant_id`.
 *
 * Estrategia primaria de aislamiento (ADR-001): el plano de tienda firma un JWT
 * con el tenant activo y lo pasa a Supabase por el callback `accessToken`; las
 * políticas RLS filtran por `auth.jwt() ->> 'tenant_id'`.
 *
 * ⚠️ Riesgo a cerrar en el PoC (HU-171): el ejemplo usa HS256 con secreto
 * compartido (`SUPABASE_JWT_SECRET`). Supabase migra a llaves asimétricas —
 * confirmar qué acepta el proyecto y ajustar `alg`/clave si aplica.
 */
import { SignJWT, jwtVerify } from 'jose'
import type { SupabaseRole, TenantJwtClaims } from './types'

export interface MintTenantJwtParams {
  /** Id del usuario autenticado, o un id de sesión anónima para el storefront. */
  userId: string
  /** Tenant activo, previamente verificado como membresía del usuario (si aplica). */
  tenantId: string
  /** Secreto JWT de Supabase (server-only). */
  secret: string
  /**
   * Rol de Postgres. `authenticated` (default) para usuarios con sesión;
   * `anon` para el storefront público (lectura de catálogo por tenant).
   */
  role?: SupabaseRole
  /** Vigencia del token. Por defecto '1h'. */
  expiresIn?: string
}

function encodeSecret(secret: string): Uint8Array {
  if (!secret) {
    // Fail-closed: sin secreto no se puede firmar un token de confianza.
    throw new Error('[tenancy] SUPABASE_JWT_SECRET vacío: no se puede firmar el JWT de tenant')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Firma un JWT de Supabase con `sub`, `role: 'authenticated'` y `tenant_id`.
 * El llamador DEBE haber verificado antes que el usuario pertenece al tenant.
 */
export async function mintTenantJwt(params: MintTenantJwtParams): Promise<string> {
  const { userId, tenantId, secret, role = 'authenticated', expiresIn = '1h' } = params
  if (!userId) throw new Error('[tenancy] userId requerido para firmar el JWT')
  if (!tenantId) throw new Error('[tenancy] tenantId requerido para firmar el JWT')

  return new SignJWT({ role, tenant_id: tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodeSecret(secret))
}

/**
 * Verifica un JWT de tenant y devuelve sus claims tipados.
 * Lanza si la firma es inválida, expiró o falta `tenant_id` (fail-closed).
 */
export async function verifyTenantJwt(token: string, secret: string): Promise<TenantJwtClaims> {
  const { payload } = await jwtVerify(token, encodeSecret(secret))
  const tenantId = payload.tenant_id
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new Error('[tenancy] JWT sin claim tenant_id válido')
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('[tenancy] JWT sin sub válido')
  }
  const role: SupabaseRole = payload.role === 'anon' ? 'anon' : 'authenticated'
  return { sub: payload.sub, role, tenant_id: tenantId }
}
