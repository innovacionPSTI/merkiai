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

/**
 * Idempotente (HU-215): garantiza el Team del tenant SIN duplicar.
 * Stack Auth permite display names repetidos, así que la fuente de verdad es
 * `tenants.stack_team_id`: si ya existe, se reusa; si no, se crea y se persiste.
 * Devuelve el teamId o null si Stack Auth (proyecto admin) no está configurado.
 */
export async function ensureTenantTeam(
  input: { tenantId: string; name: string; plan?: string },
  deps: { db: Db; adminIdentity: IdentityProvider | null },
): Promise<{ teamId: string | null; created: boolean }> {
  const { db, adminIdentity } = deps
  const plan = (input.plan ?? 'free').trim()

  // 1. ¿Ya tiene Team? → reusar (idempotencia).
  const current = await db.from('tenants').select('stack_team_id').eq('id', input.tenantId).maybeSingle()
  const existingTeamId = (current.data as { stack_team_id?: string | null } | null)?.stack_team_id
  if (existingTeamId) return { teamId: existingTeamId, created: false }

  // 2. Sin proveedor → no se puede crear (provisioning parcial).
  if (!adminIdentity) return { teamId: null, created: false }

  // 3. Crear y persistir.
  const { orgId } = await adminIdentity.createOrg({
    name: input.name,
    metadata: { tenant_id: input.tenantId, plan, status: 'active' },
  })
  await db.from('tenants').update({ stack_team_id: orgId }).eq('id', input.tenantId)
  return { teamId: orgId, created: true }
}

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

  // 3) Team en Stack Auth (proyecto admin) + dueño.
  //    El tenant YA existe (paso 2): si el Team falla, NO se borra — se degrada a
  //    "provisioning parcial" (coherente con la UI: el Team se adjunta luego) y se
  //    reporta el error como warning para que el operador pueda reintentar/corregir.
  //    ensureTenantTeam es idempotente (HU-215): no duplica Teams en reintentos.
  let teamId: string | null = null
  if (adminIdentity) {
    try {
      const r = await ensureTenantTeam({ tenantId, name, plan }, { db, adminIdentity })
      teamId = r.teamId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      warnings.push(`No se pudo crear el Team en Stack Auth (${msg}). Tenant creado en modo parcial — el Team se puede adjuntar luego.`)
    }
    // Invitación del dueño: sólo si hay Team y email. Falla aparte (no tumba el tenant).
    if (teamId && ownerEmail && adminIdentity.inviteMember) {
      try {
        await adminIdentity.inviteMember(teamId, ownerEmail)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        warnings.push(`Team creado pero no se pudo invitar al dueño (${msg}). Reintenta la invitación desde el admin.`)
      }
    }
  } else {
    warnings.push('Stack Auth (proyecto admin) no configurado: Team no creado — provisioning parcial.')
  }

  // 4) Seed de config por-tenant → HU-207.
  warnings.push('Config por-tenant (store_config/…) pendiente de HU-207.')

  return { tenantId, teamId, warnings }
}
