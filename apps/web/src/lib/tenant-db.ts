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
import type { SupabaseRole } from '@merkiai/tenancy'
import type { Database } from '@merkiai/database/types'
import { resolveTenant, type ResolvedTenant } from './tenant-context'

/**
 * HU-362 · Construye el cliente tenant-scoped usando el **destino dedicado** si el
 * control plane lo resolvió (BD propia del tenant + su JWT secret), o los
 * **globals de env** del clúster compartido en caso contrario (retrocompatible:
 * el tenant compartido se comporta idéntico). Fail-closed: exige un JWT secret.
 */
function buildClientFor(resolved: ResolvedTenant, role: SupabaseRole, userId: string) {
  const target = resolved.dedicatedTarget
  const url = target?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = target?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  const secret = target?.jwtSecret ?? process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('[web] JWT secret no disponible: ni dedicatedTarget.jwtSecret ni SUPABASE_JWT_SECRET.')
  }
  return createTenantClient<Database>({
    url,
    anonKey,
    accessToken: () => mintTenantJwt({ userId, tenantId: resolved.tenantId, secret, role }),
  })
}

/**
 * Cliente de solo-lectura del storefront, scoped por tenant vía RLS.
 * @param tenantId tenant activo (obligatorio; resuelto por host).
 */
export function getTenantDb(tenantId: string) {
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
  const resolved = await resolveTenant()
  return buildClientFor(resolved, 'anon', 'storefront-anon')
}

/**
 * Cliente de **catálogo/contenido** para el request: SIEMPRE tenant-scoped (rol
 * `anon` + RLS) con el tenant resuelto desde el Host. **Fail-closed**: exige
 * `SUPABASE_JWT_SECRET`; si falta, lanza (no hay degradación a service-role en el
 * plano de tienda). La RLS es la frontera dura (ADR-001).
 */
export async function getRequestCatalogDb() {
  // Fail-closed del clúster compartido: exige el secret global. Para un tenant
  // dedicado, buildClientFor usa además el jwtSecret de su destino (que lo override).
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('[web] SUPABASE_JWT_SECRET requerido: la RLS de catálogo/contenido es obligatoria (sin service-role en el plano de tienda).')
  }
  const resolved = await resolveTenant()
  return buildClientFor(resolved, 'anon', 'storefront-anon')
}

/**
 * Cliente tenant-scoped con rol **`authenticated`** para flujos con sesión
 * (cuenta, checkout). El JWT lleva `sub` = id del usuario (Stack Auth) + el
 * claim `tenant_id`, para que las políticas RLS de datos propios del usuario
 * (customers/orders/addresses/cart) apliquen. HU-156 (enabler; ver
 * docs/HU-156-rls-flujos-con-sesion.md antes de cablear).
 */
export function getUserTenantDb(userId: string, tenantId: string) {
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
  const resolved = await resolveTenant()
  return buildClientFor(resolved, 'authenticated', userId)
}

/**
 * Cliente de **datos del comprador** para el request: SIEMPRE rol `authenticated`
 * (tenant + `sub`), acotado por la RLS de flujos con sesión (`e17/05`).
 * **Fail-closed**: exige `SUPABASE_JWT_SECRET`; si falta, lanza (no hay
 * degradación a service-role para datos del comprador). La escritura sensible
 * (crear pedido, stock, webhooks) sigue por su vía privilegiada, no por aquí.
 */
export async function getRequestUserDb(userId: string) {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('[web] SUPABASE_JWT_SECRET requerido: la RLS de flujos con sesión es obligatoria.')
  }
  const resolved = await resolveTenant()
  return buildClientFor(resolved, 'authenticated', userId)
}
