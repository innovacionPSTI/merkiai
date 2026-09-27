'use server'

import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { applyOnboardingPreset } from '@/lib/onboarding'

export interface OnboardingActionState {
  ok: boolean
  error?: string
  message?: string
}

/** Aplica el preset elegido a la tienda (HU-236). Gated por rol + plan. */
export async function applyPresetAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    return { ok: false, error: 'No autorizado.' }
  }

  const presetKey = String(formData.get('presetKey') ?? '').trim()
  if (!presetKey) return { ok: false, error: 'Elige un preset.' }

  const invRaw = String(formData.get('inventory_model') ?? '').trim()
  const inventoryOverride = invRaw === 'single' || invRaw === 'multi_location' ? invRaw : undefined

  const res = await applyOnboardingPreset(adminUser.tenantId, presetKey, inventoryOverride)
  if (!res.ok) return { ok: false, error: res.error ?? 'No se pudo aplicar el preset.' }

  revalidatePath('/onboarding')
  revalidatePath('/')
  return { ok: true, message: 'Preset aplicado. Revisa tu tienda y ajústala desde el panel.' }
}
