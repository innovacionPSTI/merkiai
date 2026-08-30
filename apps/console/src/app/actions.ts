'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformOperator } from '@/lib/platform-auth'
import { platformDb } from '@/lib/platform-db'
import { parsePlanForm } from '@/lib/plan-validation'
import { getPlans } from '@/lib/plans'
import { provisionTenant } from '@/lib/provisioning'
import { adminIdentity } from '@/lib/admin-identity'

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
    revalidatePath('/')
    // Warnings "esperados" (config pendiente HU-207) no se muestran como problema.
    const relevant = (res.warnings ?? []).filter((w) => !/HU-207/.test(w))
    return {
      ok: true,
      message: res.teamId
        ? `Tenant "${name}" creado (${subdomain}.merkiai.com), plan ${plan}.`
        : `Tenant "${name}" creado en modo parcial (sin Team). Revisa los avisos.`,
      warnings: relevant.length ? relevant : undefined,
    }
  } catch (e) {
    // Falla dura previa al insert (subdominio en uso / inválido).
    const msg = e instanceof Error ? e.message.replace(/^\[provision\]\s*/, '') : 'Error desconocido'
    return { ok: false, error: `No se pudo crear el tenant: ${msg}.` }
  }
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
