/**
 * Abstracción del proveedor de identidad (E17). El código de la app depende de
 * esta interfaz, NO de Stack Auth directamente → migrar a otro proveedor
 * (Auth0, FusionAuth, Clerk, propio…) es escribir un nuevo adaptador, sin tocar
 * los consumidores. Mismo patrón interfaz+factory de pagos/email/billing.
 *
 * Convención de vocabulario neutral:
 *   - "org" = organización/tenant (en Stack Auth = Team).
 *   - "platform permission" = permiso global (Project Permission).
 *   - "org permission" = permiso dentro de la org (Team Permission).
 */

export interface IdentityUser {
  id: string
  email: string | null
  displayName: string | null
}

export interface IdentityProvider {
  // ── Sesión / autorización (server-side) ─────────────────────────────────
  /** Usuario autenticado de la petición actual, o null. */
  getCurrentUser(): Promise<IdentityUser | null>
  /** ¿El usuario tiene un permiso GLOBAL de plataforma? (RBAC global) */
  hasPlatformPermission(permissionId: string): Promise<boolean>
  /** ¿El usuario tiene un permiso dentro de una org/tenant? (RBAC por org) */
  hasOrgPermission(orgId: string, permissionId: string): Promise<boolean>

  // ── Provisioning (server-side, automatizable desde nuestra API) ──────────
  /** Crea una org/tenant. Devuelve su id (para espejar en `tenants.stack_team_id`). */
  createOrg(input: { name: string; metadata?: Record<string, unknown> }): Promise<{ orgId: string }>
  /** Agrega un usuario existente a una org. */
  addMember(orgId: string, userId: string): Promise<void>
  /** Otorga un permiso de org a un miembro. */
  grantOrgPermission(orgId: string, userId: string, permissionId: string): Promise<void>
  /** Invita por email a una org (opcional según proveedor). */
  inviteMember?(orgId: string, email: string): Promise<void>
  /** Actualiza metadata de servidor de la org (opcional). */
  setOrgMetadata?(orgId: string, metadata: Record<string, unknown>): Promise<void>
}
