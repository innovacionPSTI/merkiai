'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformOperator } from '@/lib/platform-auth'
import { platformDb } from '@/lib/platform-db'

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
