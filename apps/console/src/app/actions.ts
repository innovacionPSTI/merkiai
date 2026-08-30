'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformOperator } from '@/lib/platform-auth'
import { platformDb } from '@/lib/platform-db'
import { parsePlanForm } from '@/lib/plan-validation'
import { getPlans } from '@/lib/plans'
import { provisionTenant } from '@/lib/provisioning'
import { adminIdentity } from '@/lib/admin-identity'
import { provisionOwnerProfile } from '@/lib/admin-provision'

const SUBDOMAIN_RE = /^[a-z0-9-]{2,40}$/

/** Estado del formulario de creación de tenant (para `useActionState`). */
export interface CreateTenantState {
  ok: boolean
  error?: string
  message?: string
  warnings?: string[]
}

/**
 * Aprovisiona un tenant nuevo (HU-209). Gated por `platform:operate`.
 * Firma compatible con `useActionState`: devuelve estado para que la UI muestre
 * error/éxito/warnings (antes tragaba el error en silencio).
 */
export async function createTenant(
  _prev: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  await requirePlatformOperator()
  const name = String(formData.get('name') ?? '').trim()
  const subdomain = String(formData.get('subdomain') ?? '').trim().toLowerCase()
  const ownerEmail = String(formData.get('ownerEmail') ?? '').trim()
  const plan = String(formData.get('plan') ?? 'free').trim().toLowerCase() || 'free'

  if (!name) return { ok: false, error: 'El nombre del negocio es obligatorio.' }
  if (!SUBDOMAIN_RE.test(subdomain)) {
    return { ok: false, error: 'Subdominio inválido: usa 2–40 caracteres a–z, 0–9 o guion.' }
  }
  // El plan debe existir en el catálogo (además de la FK tenants_plan_fk).
  const plans = await getPlans()
  if (!plans.some((p) => p.key === plan)) {
    return { ok: false, error: `El plan "${plan}" no existe en el catálogo.` }
  }

  try {
    const res = await provisionTenant(
      { name, subdomain, plan, ownerEmail: ownerEmail || undefined },
      { db: platformDb(), adminIdentity: adminIdentity() },
    )
    // Warnings "esperados" (config pendiente HU-207) no se muestran como problema.
    const warnings = (res.warnings ?? []).filter((w) => !/HU-207/.test(w))

    // Rol de admin del dueño: crea su `profiles` (rol admin + tenant_id) vía el
    // admin. Solo si hay Team (identidad lista) y email. Falla aparte (no tumba).
    if (res.teamId && ownerEmail) {
      const prof = await provisionOwnerProfile({ email: ownerEmail, tenantId: res.tenantId, role: 'super_admin' })
      if (!prof.ok) {
        warnings.push(`Dueño invitado al Team pero no se pudo asignar el rol de super admin (${prof.error}). Reintenta "Invitar dueño".`)
      }
    }

    revalidatePath('/')
    return {
      ok: true,
      message: res.teamId
        ? `Tenant "${name}" creado (${subdomain}.merkiai.com), plan ${plan}.`
        : `Tenant "${name}" creado en modo parcial (sin Team). Revisa los avisos.`,
      warnings: warnings.length ? warnings : undefined,
    }
  } catch (e) {
    // Falla dura previa al insert (subdominio en uso / inválido).
    const msg = e instanceof Error ? e.message.replace(/^\[provision\]\s*/, '') : 'Error desconocido'
    return { ok: false, error: `No se pudo crear el tenant: ${msg}.` }
  }
}

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

/** Estado de las acciones por-tenant (invitar dueño / eliminar). */
export interface TenantActionState {
  ok: boolean
  error?: string
  message?: string
}

/**
 * Invita (o cambia) al dueño/super-admin de un tenant existente (HU-209).
 * Envía una invitación de Team al email indicado. Requiere que el tenant tenga
 * `stack_team_id` (Team ya creado). Gated por `platform:operate`.
 */
export async function inviteTenantOwner(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await requirePlatformOperator()
  const id = String(formData.get('id') ?? '')
  const email = String(formData.get('ownerEmail') ?? '').trim()
  if (!id || !email) return { ok: false, error: 'Falta el tenant o el email.' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'Email inválido.' }

  const db = platformDb()
  const { data } = await db.from('tenants').select('stack_team_id').eq('id', id).maybeSingle()
  const teamId = (data as { stack_team_id?: string | null } | null)?.stack_team_id
  if (!teamId) {
    return { ok: false, error: 'Este tenant aún no tiene Team en Stack Auth (provisioning parcial). Créalo primero.' }
  }

  const identity = adminIdentity()
  if (!identity?.inviteMember) {
    return { ok: false, error: 'Stack Auth (proyecto admin) no está configurado en la consola.' }
  }
  // Invitación al Team: best-effort e idempotente. Si el dueño YA es miembro
  // (caso reintento), no debe bloquear la asignación del rol.
  let inviteNote = ''
  try {
    await identity.inviteMember(teamId, email)
  } catch (e) {
    inviteNote = ` (aviso: no se reenvió la invitación al Team: ${e instanceof Error ? e.message : String(e)})`
  }

  // Rol de super admin del dueño (profiles en la BD del admin). ESTO es lo que
  // habilita el acceso; sin esto el dueño se une al Team pero ve "Sin acceso".
  const prof = await provisionOwnerProfile({ email, tenantId: id, role: 'super_admin' })
  revalidatePath('/')
  if (!prof.ok) {
    return { ok: false, error: `No se pudo asignar el rol de super admin: ${prof.error}` }
  }
  return {
    ok: true,
    message: `Dueño ${email} con rol de super admin asignado.${inviteNote} Si ya había iniciado sesión, debe recargar o cerrar sesión y volver a entrar.`,
  }
}

/**
 * Elimina un tenant (HU-209 · zona de peligro). Irreversible: borra el registro
 * de plataforma y (best-effort) el Team en Stack Auth. NO toca los datos del
 * plano de tienda (productos/pedidos con ese `tenant_id`) — pensado para tiendas
 * de prueba / no aprovisionadas. Confirmación por coincidencia de subdominio.
 * Gated por `platform:operate`.
 */
export async function deleteTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await requirePlatformOperator()
  const id = String(formData.get('id') ?? '')
  const confirm = String(formData.get('confirm') ?? '').trim().toLowerCase()
  const subdomain = String(formData.get('subdomain') ?? '').trim().toLowerCase()
  if (!id) return { ok: false, error: 'Falta el tenant.' }
  if (id === DEFAULT_TENANT_ID) return { ok: false, error: 'No se puede eliminar el tenant por defecto (migración).' }
  if (!subdomain || confirm !== subdomain) {
    return { ok: false, error: `La confirmación no coincide. Escribe "${subdomain}" para eliminar.` }
  }

  const db = platformDb()
  // Best-effort: borrar el Team en Stack Auth para no dejar huérfanos.
  const { data } = await db.from('tenants').select('stack_team_id').eq('id', id).maybeSingle()
  const teamId = (data as { stack_team_id?: string | null } | null)?.stack_team_id
  const identity = adminIdentity()
  if (teamId && identity?.deleteOrg) {
    try { await identity.deleteOrg(teamId) } catch { /* el Team puede reciclarse aparte */ }
  }

  const { error } = await db.from('tenants').delete().eq('id', id)
  if (error) return { ok: false, error: `No se pudo eliminar: ${error.message}` }
  revalidatePath('/')
  return { ok: true, message: 'Tenant eliminado.' }
}

/** Suspende / reactiva un tenant (consola). */
export async function setTenantStatus(formData: FormData) {
  await requirePlatformOperator()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['active', 'suspended'].includes(status)) return
  await platformDb().from('tenants').update({ status }).eq('id', id)
  revalidatePath('/')
}

/** Crea o edita un plan del catálogo (HU-173). Gated por `platform:operate`. */
export async function savePlan(formData: FormData) {
  await requirePlatformOperator()
  const parsed = parsePlanForm({
    key:            String(formData.get('key') ?? ''),
    name:           String(formData.get('name') ?? ''),
    price_cents:    String(formData.get('price_cents') ?? '0'),
    currency:       String(formData.get('currency') ?? 'COP'),
    features:       String(formData.get('features') ?? ''),
    limits:         String(formData.get('limits') ?? ''),
    data_isolation: String(formData.get('data_isolation') ?? 'shared'),
    active:         String(formData.get('active') ?? 'true'),
  })
  if (!parsed.ok) return // (la UI valida; el server rechaza en silencio si es inválido)

  await platformDb().from('plans').upsert(parsed.value, { onConflict: 'key' })
  revalidatePath('/')
}

/** Asigna un plan existente a un tenant (HU-173). Gated. */
export async function setTenantPlan(formData: FormData) {
  await requirePlatformOperator()
  const id = String(formData.get('id') ?? '')
  const plan = String(formData.get('plan') ?? '').trim().toLowerCase()
  if (!id || !plan) return

  // El plan debe existir en el catálogo (además de la FK tenants_plan_fk).
  const plans = await getPlans()
  if (!plans.some((p) => p.key === plan)) return

  await platformDb().from('tenants').update({ plan }).eq('id', id)
  revalidatePath('/')
}
