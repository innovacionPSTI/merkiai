/**
 * Fábricas de clientes Supabase para multi-tenant.
 *
 * Regla de oro (ADR-001): el **plano de tienda** (apps/web, apps/admin) usa
 * SIEMPRE `createTenantClient` (rol `authenticated`, sujeto a RLS) y NUNCA el
 * service-role. `createPlatformClient` (service-role, omite RLS) es exclusivo
 * del **control plane**.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface TenantClientOptions {
  /** URL del proyecto Supabase del plano de tienda. */
  url: string
  /** Anon key (rol público; la autorización real la impone la RLS + JWT). */
  anonKey: string
  /**
   * Proveedor del access token: devuelve el JWT firmado con el claim
   * `tenant_id` (ver `mintTenantJwt`). Supabase lo envía en cada request.
   */
  accessToken: () => Promise<string>
}

/**
 * Cliente del plano de tienda. Todas sus queries quedan sujetas a RLS: sólo ve
 * filas cuyo `tenant_id` coincide con el claim del JWT. Aunque una query olvide
 * el filtro, la RLS impide la fuga.
 */
export function createTenantClient<Schema = any>(opts: TenantClientOptions): SupabaseClient<Schema> {
  if (!opts.url || !opts.anonKey) {
    throw new Error('[tenancy] createTenantClient requiere url y anonKey')
  }
  return createClient<Schema>(opts.url, opts.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // El callback accessToken hace que Supabase envíe nuestro JWT (con tenant_id)
    // en el header Authorization de cada request → la RLS lo lee vía auth.jwt().
    accessToken: opts.accessToken,
  })
}

export interface PlatformClientOptions {
  /** URL del proyecto Supabase de PLATAFORMA (distinto al del plano de tienda). */
  url: string
  /** Service-role key. Omite RLS: sólo el control plane debe usarla. */
  serviceRoleKey: string
}

/**
 * Cliente del control plane sobre la BD de plataforma. Omite RLS (service-role):
 * NO usar en el plano de tienda. Para operaciones cross-tenant auditadas.
 */
export function createPlatformClient(opts: PlatformClientOptions): SupabaseClient {
  if (!opts.url || !opts.serviceRoleKey) {
    throw new Error('[tenancy] createPlatformClient requiere url y serviceRoleKey')
  }
  return createClient(opts.url, opts.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
