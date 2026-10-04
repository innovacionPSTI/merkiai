'use server'

import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { applyOnboardingPreset, completeOnboarding, dismissOnboarding, reopenOnboarding } from '@/lib/onboarding'

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

/** HU-236 v2: marca el onboarding como completado u omitido, o lo reabre. */
export async function setOnboardingDoneAction(formData: FormData): Promise<void> {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) return

  const intent = String(formData.get('intent') ?? '')
  if (intent === 'complete') await completeOnboarding(adminUser.tenantId)
  else if (intent === 'dismiss') await dismissOnboarding(adminUser.tenantId)
  else if (intent === 'reopen') await reopenOnboarding(adminUser.tenantId)

  revalidatePath('/onboarding')
  revalidatePath('/')
}
