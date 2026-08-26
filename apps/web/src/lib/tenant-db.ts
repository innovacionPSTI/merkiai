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
 * Cliente de **catálogo** para el request, con degradación segura (HU-157):
 *  - Con `SUPABASE_JWT_SECRET` presente → cliente **tenant-scoped** (rol `anon`
 *    + RLS), resolviendo el tenant desde el Host de la petición.
 *  - Sin el secreto (aún single-tenant / RLS no aplicado) → `undefined`, para
 *    que la query use su cliente server-role por defecto (comportamiento actual).
 *
 * Permite desplegar la resolución por host y **activarla por configuración**
 * (definir `SUPABASE_JWT_SECRET` + aplicar `e17/02_rls_catalog.sql` +
 * `CONTROL_PLANE_URL`/`INTERNAL_API_SECRET`) sin romper el despliegue single-tenant.
 */
export async function getRequestCatalogDb() {
  if (!process.env.SUPABASE_JWT_SECRET) return undefined
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

/**
 * Cliente de **datos del comprador** para el request, con degradación segura y
 * **gate propio** (HU-156, flujos con sesión). Devuelve el cliente rol
 * `authenticated` (tenant + `sub`) SOLO cuando:
 *   - `SESSION_RLS_ENABLED === 'true'` (se activa TRAS validar aislamiento entre
 *     compradores en staging y aplicar `e17/05_rls_session_flows.sql`), y
 *   - `SUPABASE_JWT_SECRET` está definido.
 * En cualquier otro caso devuelve `undefined` → la query usa su cliente
 * server-role (comportamiento actual). Así el cableado se despliega inerte y se
 * activa por configuración, sin arriesgar fugas antes de la validación.
 */
export async function getRequestUserDb(userId: string) {
  if (process.env.SESSION_RLS_ENABLED !== 'true' || !process.env.SUPABASE_JWT_SECRET) {
    return undefined
  }
  const { tenantId } = await resolveTenant()
  return getUserTenantDb(userId, tenantId)
}
