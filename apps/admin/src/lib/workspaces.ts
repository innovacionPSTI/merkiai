/**
 * Workspaces del operador (HU-158). Un workspace = un Team de Stack Auth = un
 * tenant. El `tenant_id` viene del `serverMetadata` del Team (lo fija el
 * aprovisionamiento, HU-209). La lectura de Stack Auth va guardada.
 */
import { stackServerApp } from '@/stack'

export interface Workspace {
  tenantId: string
  teamId: string
  name: string
}

/** Lista los workspaces (Teams con `tenant_id` en su metadata) del usuario. */
export async function listWorkspaces(): Promise<Workspace[]> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) return []
    const teams = await user.listTeams()
    const out: Workspace[] = []
    for (const t of teams) {
      const meta = (t as unknown as { serverMetadata?: { tenant_id?: string } }).serverMetadata
      const tenantId = meta?.tenant_id
      if (tenantId) out.push({ tenantId, teamId: t.id, name: t.displayName })
    }
    return out
  } catch {
    return []
  }
}

export type WorkspaceDecision =
  | { mode: 'none' }
  | { mode: 'active'; tenantId: string }
  | { mode: 'auto'; tenantId: string }
  | { mode: 'select' }

/**
 * Decide qué hacer tras el login a partir de los workspaces y el tenant activo:
 *   0 → 'none' (sin acceso) · 1 → 'auto' · activo válido → 'active' · >1 → 'select'.
 * Función pura (testeable).
 */
export function resolveWorkspace(workspaces: Workspace[], activeTenantId: string | null): WorkspaceDecision {
  if (workspaces.length === 0) return { mode: 'none' }
  if (activeTenantId && workspaces.some((w) => w.tenantId === activeTenantId)) {
    return { mode: 'active', tenantId: activeTenantId }
  }
  if (workspaces.length === 1) return { mode: 'auto', tenantId: workspaces[0]!.tenantId }
  return { mode: 'select' }
}
