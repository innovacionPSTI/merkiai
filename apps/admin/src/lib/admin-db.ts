/**
 * Cliente de datos del panel admin **acotado por tenant vía RLS** (HU-158 · Etapa 2).
 *
 * Reemplaza a `createServerClient()` (service-role, que OMITE RLS → fuga
 * cross-tenant). Acuña un JWT con `role: 'authenticated'`, el claim `tenant_id`
 * del tenant que administra el usuario y `is_admin: true`, de modo que las
 * políticas RLS `*_admin_all` (ver `e17/09_rls_admin.sql`) le dan CRUD completo
 * SOLO sobre las filas de SU tenant.
 *
 * Fail-closed: exige `SUPABASE_JWT_SECRET`; si falta, lanza (no degrada a
 * service-role). Requiere en el entorno del admin: `SUPABASE_JWT_SECRET`,
 * `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
 */
import { createTenantClient, mintTenantJwt } from '@merkiai/tenancy'
import type { Database } from '@merkiai/database'

export function getAdminDb(tenantId: string, adminUserId = 'admin-panel') {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('[admin] SUPABASE_JWT_SECRET requerido: el panel usa RLS por tenant (sin service-role).')
  }
  if (!tenantId) {
    throw new Error('[admin] getAdminDb requiere tenantId (de getAdminUser).')
  }
  return createTenantClient<Database>({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    accessToken: () =>
      mintTenantJwt({
        userId: adminUserId,
        tenantId,
        secret,
        role: 'authenticated',
        claims: { is_admin: true },
      }),
  })
}
