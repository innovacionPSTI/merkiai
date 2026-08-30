/**
 * Adaptador de Stack Auth para la interfaz `IdentityProvider` (@merkiai/tenancy).
 * Es el ÚNICO archivo del console acoplado a Stack Auth para identidad; el resto
 * del código usa la interfaz. Migrar de proveedor = reemplazar este adaptador.
 */
import type { IdentityProvider } from '@merkiai/tenancy'
import { stackServerApp } from '@/stack'

/**
 * Adaptador parametrizable por proyecto Stack Auth.
 * - Sesión/permiso de plataforma → app del CONSOLE (default).
 * - Provisioning de orgs/tenants (createOrg/addMember/…) → debe usarse con una
 *   instancia del proyecto **ADMIN** (donde viven los operadores de tienda),
 *   no la del console. Ver docs/identidad-abstraccion-y-migracion.md.
 */
type StackApp = typeof stackServerApp

export interface StackIdentityOptions {
  /**
   * URL de retorno para la invitación de Team (`team.inviteUser`). Stack Auth la
   * EXIGE en entorno servidor (sin ella lanza "callbackUrl option is required in
   * a non-browser environment"). Debe apuntar al handler del proyecto dueño del
   * Team (el admin): `https://admin.merkiai.com/handler/team-invitation`.
   */
  inviteCallbackUrl?: string
}

export function stackIdentity(app: StackApp = stackServerApp, opts: StackIdentityOptions = {}): IdentityProvider {
  return {
    async getCurrentUser() {
      const u = await app.getUser()
      return u ? { id: u.id, email: u.primaryEmail ?? null, displayName: u.displayName ?? null } : null
    },

    async hasPlatformPermission(permissionId) {
      const u = await app.getUser()
      return u ? await u.hasPermission(permissionId) : false
    },

    async hasOrgPermission(orgId, permissionId) {
      const u = await app.getUser()
      if (!u) return false
      const team = await app.getTeam(orgId)
      return team ? await u.hasPermission(team, permissionId) : false
    },

    async createOrg({ name, metadata }) {
      const team = await app.createTeam({ displayName: name })
      if (metadata) {
        await team.update({ serverMetadata: metadata } as Parameters<typeof team.update>[0])
      }
      return { orgId: team.id }
    },

    async addMember(orgId, userId) {
      const team = await app.getTeam(orgId)
      if (!team) throw new Error('[identity] org no encontrada')
      await team.addUser(userId)
    },

    async grantOrgPermission(orgId, userId, permissionId) {
      const team = await app.getTeam(orgId)
      const user = await app.getUser(userId)
      if (!team || !user) throw new Error('[identity] org/usuario no encontrado')
      await user.grantPermission(team, permissionId)
    },

    async inviteMember(orgId, email) {
      const team = await app.getTeam(orgId)
      if (!team) throw new Error('[identity] org no encontrada')
      // callbackUrl es obligatorio en servidor (Stack Auth). Ver StackIdentityOptions.
      if (!opts.inviteCallbackUrl) {
        throw new Error('[identity] inviteCallbackUrl requerido para invitar en servidor')
      }
      await team.inviteUser({ email, callbackUrl: opts.inviteCallbackUrl })
    },

    async setOrgMetadata(orgId, metadata) {
      const team = await app.getTeam(orgId)
      if (!team) throw new Error('[identity] org no encontrada')
      await team.update({ serverMetadata: metadata } as Parameters<typeof team.update>[0])
    },

    async deleteOrg(orgId) {
      const team = await app.getTeam(orgId)
      if (!team) return // idempotente: si ya no existe, nada que borrar
      await team.delete()
    },
  }
}
