/**
 * Onboarding del admin (HU-236). El admin no ve la BD de plataforma (presets),
 * así que pide al control plane los presets del plan del tenant + los topes ya
 * resueltos, y aplica el elegido a su PROPIO store DB con el orquestador HU-235.
 *
 * Los límites son regla de negocio (fail-open): si el control plane no responde,
 * `getOnboardingOptions` devuelve null y el onboarding muestra un aviso, no rompe.
 */
import { applyPresetToStore, type PresetPayload, type ApplyPresetResult } from '@merkiai/database'
import { getAdminDb } from './admin-db'

export interface OnboardingPreset {
  key: string
  name: string
  niche: string
  description: string | null
  theme: Record<string, unknown>
  template: string
  home_sections: unknown[]
  sample_categories: unknown[]
  sample_products: unknown[]
  inventory_model: 'single' | 'multi_location'
  available_in_plans: string[]
}

export interface OnboardingOptions {
  plan: string
  presets: OnboardingPreset[]
  limits: { categories: number | null; products: number | null }
  allowMultiLocation: boolean
}

/** Pide al control plane los presets aplicables al plan del tenant. */
export async function getOnboardingOptions(tenantId: string): Promise<OnboardingOptions | null> {
  const base = process.env.CONTROL_PLANE_URL
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return null
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/internal/tenants/${tenantId}/presets`, {
      headers: { 'x-internal-secret': secret },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as OnboardingOptions
  } catch {
    return null
  }
}

/** PresetRow (plataforma) → payload del orquestador. */
function toPayload(p: OnboardingPreset): PresetPayload {
  return {
    theme: p.theme,
    template: p.template,
    home_sections: p.home_sections as PresetPayload['home_sections'],
    sample_categories: p.sample_categories as PresetPayload['sample_categories'],
    sample_products: p.sample_products as PresetPayload['sample_products'],
    inventory_model: p.inventory_model,
  }
}

export interface ApplyPresetOutcome {
  ok: boolean
  error?: string
  result?: ApplyPresetResult['results']
}

/**
 * Aplica el preset elegido al store DB del tenant, respetando el plan.
 * `inventoryOverride` permite que el operador fije el modelo (limitado por
 * `allowMultiLocation`). Usa el cliente admin RLS-scoped (tenant_id explícito).
 */
export async function applyOnboardingPreset(
  tenantId: string,
  presetKey: string,
  inventoryOverride?: 'single' | 'multi_location',
): Promise<ApplyPresetOutcome> {
  const opts = await getOnboardingOptions(tenantId)
  if (!opts) return { ok: false, error: 'No se pudo consultar el catálogo de presets (control plane).' }

  const preset = opts.presets.find((p) => p.key === presetKey)
  if (!preset) return { ok: false, error: 'El preset no está disponible para tu plan.' }

  const payload = toPayload(preset)
  if (inventoryOverride) payload.inventory_model = inventoryOverride

  try {
    const res = await applyPresetToStore(
      tenantId,
      payload,
      {
        limits: { categories: opts.limits.categories ?? undefined, products: opts.limits.products ?? undefined },
        allowMultiLocation: opts.allowMultiLocation,
      },
      getAdminDb(tenantId),
    )
    return { ok: true, result: res.results }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
