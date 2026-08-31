/**
 * Helper de autenticación para el panel admin.
 *
 * Combina Stack Auth (identidad) con Supabase profiles (rol).
 * Stack Auth provee email; Supabase profiles provee el rol de admin.
 */

import { stackServerApp } from '@/stack'
import { createServerClient } from '@merkiai/database'
import type { AdminRole } from './roles'
import { isAdminRole } from './roles'
import { getActiveTenantId } from './active-tenant'

export interface AdminUser {
  /** Email verificado en Stack Auth */
  email: string
  /** Nombre para mostrar (Stack Auth displayName o full_name en profiles) */
  displayName: string
  /** Rol asignado en Supabase profiles (para el tenant resuelto) */
  role: AdminRole
  /** Tenant que administra (HU-158): de su fila `profiles`. */
  tenantId: string
  /** true si el correo tiene perfil admin en >1 tenant y falta elegir cuál. */
  needsWorkspaceSelection: boolean
}

/**
 * Obtiene el usuario admin autenticado y **el tenant que administra** (HU-158).
 *
 * Resolución del tenant (decisión aprobada): desde `profiles.tenant_id`.
 *  - 0 perfiles admin → sin acceso (null).
 *  - 1 perfil admin → ese tenant.
 *  - >1 perfiles admin → el que coincida con la **cookie de tenant activo**; si
 *    ninguna coincide, `needsWorkspaceSelection=true` (el layout manda a
 *    `/seleccionar-tienda`).
 *
 * Ya NO traga el error de la consulta (antes: un email con perfiles en varios
 * tenants rompía `maybeSingle` en silencio → "Sin acceso" sin logs).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return null

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name, tenant_id')
    .eq('email', user.primaryEmail)

  if (error) {
    console.error('[auth] getAdminUser: error consultando profiles:', error.message)
    return null
  }

  const adminProfiles = (data ?? []).filter((p) => isAdminRole(p.role))
  if (adminProfiles.length === 0) return null

  const activeTenantId = await getActiveTenantId()
  const byActive = adminProfiles.find((p) => p.tenant_id === activeTenantId)
  const chosen = byActive ?? (adminProfiles.length === 1 ? adminProfiles[0] : null)

  // >1 tenant y ninguno activo → hay que elegir workspace.
  if (!chosen) {
    const first = adminProfiles[0]
    return {
      email: user.primaryEmail,
      displayName: user.displayName ?? first.full_name ?? user.primaryEmail,
      role: first.role as AdminRole,
      tenantId: first.tenant_id,
      needsWorkspaceSelection: true,
    }
  }

  return {
    email: user.primaryEmail,
    displayName: user.displayName ?? chosen.full_name ?? user.primaryEmail,
    role: chosen.role as AdminRole,
    tenantId: chosen.tenant_id,
    needsWorkspaceSelection: false,
  }
}
