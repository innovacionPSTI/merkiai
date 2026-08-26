/**
 * Cliente de datos tenant-scoped para el storefront (E17 · HU-156, Opción B).
 *
 * Devuelve un cliente Supabase que actúa con rol `anon` portando un JWT con el
 * claim `tenant_id`, de modo que las políticas RLS (`auth.jwt()->>'tenant_id'`)
 * acotan las lecturas al tenant resuelto. Reemplaza al service-role en las
 * lecturas públicas del catálogo.
 *
 * Estado (staging): el tenant se resuelve por ahora al **tenant por defecto**
 * (`DEFAULT_TENANT_ID`). La resolución real por host (subdominio/dominio) vía el
 * control plane se conecta en HU-157. No cablear en producción hasta:
 *   1) aplicar `e17/02_rls_catalog.sql`, y
 *   2) definir `SUPABASE_JWT_SECRET` (Legacy JWT secret) en el entorno.
 */
import { createTenantClient, mintTenantJwt } from '@merkiai/tenancy'
import type { Database } from '@merkiai/database/types'
import { resolveTenant } from './tenant-context'

/** Tenant por defecto (coincide con la migración e17/01_tenant_id.sql). */
const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001'

/**
 * Cliente de solo-lectura del storefront, scoped por tenant vía RLS.
 * @param tenantId tenant activo (por defecto, el tenant por defecto).
 */
export function getTenantDb(tenantId: string = DEFAULT_TENANT_ID) {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('[web] SUPABASE_JWT_SECRET no configurado (requerido por getTenantDb)')
  }
  return createTenantClient<Database>({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    // Rol `anon` + tenant_id: storefront público acotado por RLS (Opción B).
    accessToken: () =>
      mintTenantJwt({ userId: 'storefront-anon', tenantId, secret, role: 'anon' }),
  })
}

/**
 * Cliente tenant-scoped resolviendo el tenant desde el Host de la petición
 * (HU-157). Úsalo en contextos de request (route handlers / server components
 * dinámicos). Nota: al leer el Host, la página se vuelve dinámica (rompe ISR).
 */
export async function getRequestTenantDb() {
  const { tenantId } = await resolveTenant()
  return getTenantDb(tenantId)
}

/**
 * Cliente tenant-scoped con rol **`authenticated`** para flujos con sesión
 * (cuenta, checkout). El JWT lleva `sub` = id del usuario (Stack Auth) + el
 * claim `tenant_id`, para que las políticas RLS de datos propios del usuario
 * (customers/orders/addresses/cart) apliquen. HU-156 (enabler; ver
 * docs/HU-156-rls-flujos-con-sesion.md antes de cablear).
 */
export function getUserTenantDb(userId: string, tenantId: string = DEFAULT_TENANT_ID) {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('[web] SUPABASE_JWT_SECRET no configurado (requerido por getUserTenantDb)')
  }
  return createTenantClient<Database>({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    accessToken: () => mintTenantJwt({ userId, tenantId, secret, role: 'authenticated' }),
  })
}

/** Igual que `getUserTenantDb` pero resolviendo el tenant desde el host. */
export async function getRequestUserTenantDb(userId: string) {
  const { tenantId } = await resolveTenant()
  return getUserTenantDb(userId, tenantId)
}
