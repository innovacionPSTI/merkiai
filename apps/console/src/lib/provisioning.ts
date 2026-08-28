/**
 * Aprovisionamiento de tenant (HU-209). Orquesta, de forma idempotente y con
 * rollback, la creación de un tenant desde la consola:
 *   1. Valida + reserva el subdominio (único; resuelve por wildcard, sin DNS por-tenant).
 *   2. Crea la fila `tenants` (BD de plataforma).
 *   3. Crea el Team en Stack Auth (proyecto ADMIN) con serverMetadata + invita al dueño.
 *   4. (pendiente HU-207) seed de la config por-tenant.
 * Si el proyecto admin de Stack Auth no está configurado, el paso 3 se omite y
 * se reporta como "provisioning parcial" (el Team se puede adjuntar luego).
 */
import type { IdentityProvider } from '@merkiai/tenancy'
import { isValidSubdomain } from './validation'

type Db = ReturnType<typeof import('./platform-db').platformDb>

export interface ProvisionInput { name: string; subdomain: string; plan?: string; ownerEmail?: string }
export interface ProvisionDeps { db: Db; adminIdentity: IdentityProvider | null }
export interface ProvisionResult { tenantId: string; teamId: string | null; warnings: string[] }

export async function provisionTenant(input: ProvisionInput, deps: ProvisionDeps): Promise<ProvisionResult> {
  const name = (input.name ?? '').trim()
  const subdomain = (input.subdomain ?? '').trim().toLowerCase()
  const plan = (input.plan ?? 'free').trim()
  const ownerEmail = (input.ownerEmail ?? '').trim()
  const warnings: string[] = []

  if (!name) throw new Error('[provision] nombre requerido')
  if (!isValidSubdomain(subdomain)) throw new Error('[provision] subdominio inválido')

  const { db, adminIdentity } = deps

  // 1) Unicidad del subdominio
  const existing = await db.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle()
  if (existing.data?.id) throw new Error('[provision] subdominio ya en uso')

  // 2) Crear la fila del tenant
  const created = await db
    .from('tenants')
    .insert({ name, subdomain, plan, status: 'active', data_isolation: 'shared', db_ref: null })
    .select('id')
    .single()
  if (created.error || !created.data?.id) throw created.error ?? new Error('[provision] no se pudo crear el tenant')
  const tenantId = created.data.id as string

  // 3) Team en Stack Auth (proyecto admin) + dueño. Rollback si falla.
  let teamId: string | null = null
  if (adminIdentity) {
    try {
      const { orgId } = await adminIdentity.createOrg({ name, metadata: { tenant_id: tenantId, plan, status: 'active' } })
      teamId = orgId
      await db.from('tenants').update({ stack_team_id: teamId }).eq('id', tenantId)
      if (ownerEmail && adminIdentity.inviteMember) {
        await adminIdentity.inviteMember(teamId, ownerEmail)
      }
    } catch (e) {
      // Rollback: elimina el tenant para no dejar huérfanos sin Team.
      await db.from('tenants').delete().eq('id', tenantId)
      throw e instanceof Error ? e : new Error('[provision] fallo al crear el Team')
    }
  } else {
    warnings.push('Stack Auth (proyecto admin) no configurado: Team no creado — provisioning parcial.')
  }

  // 4) Seed de config por-tenant → HU-207.
  warnings.push('Config por-tenant (store_config/…) pendiente de HU-207.')

  return { tenantId, teamId, warnings }
}
