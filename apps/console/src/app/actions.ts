'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformOperator } from '@/lib/platform-auth'
import { platformDb } from '@/lib/platform-db'
import { parsePlanForm } from '@/lib/plan-validation'
import { getPlans } from '@/lib/plans'

const SUBDOMAIN_RE = /^[a-z0-9-]{2,40}$/

/** Provisiona un tenant nuevo (consola). Gated por `platform:operate`. */
export async function createTenant(formData: FormData) {
  await requirePlatformOperator()
  const name = String(formData.get('name') ?? '').trim()
  const subdomain = String(formData.get('subdomain') ?? '').trim().toLowerCase()
  if (!name || !SUBDOMAIN_RE.test(subdomain)) return
  await platformDb().from('tenants').insert({
    name,
    subdomain,
    plan: 'free',
    status: 'active',
    data_isolation: 'shared',
    db_ref: null,
  })
  revalidatePath('/')
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
