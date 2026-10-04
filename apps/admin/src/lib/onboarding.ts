/**
 * Onboarding del admin (HU-236). El admin no ve la BD de plataforma (presets),
 * así que pide al control plane los presets del plan del tenant + los topes ya
 * resueltos, y aplica el elegido a su PROPIO store DB con el orquestador HU-235.
 *
 * Los límites son regla de negocio (fail-open): si el control plane no responde,
 * `getOnboardingOptions` devuelve null y el onboarding muestra un aviso, no rompe.
 */
import {
  applyPresetToStore,
  getOnboardingState,
  setOnboardingState,
  getStoreConfig,
  getThemes,
  getProducts,
  type PresetPayload,
  type ApplyPresetResult,
  type OnboardingState,
} from '@merkiai/database'
import { getAdminDb } from './admin-db'

export type { OnboardingState }

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
  /** HU-257 · miniatura curada (null = placeholder en la galería). */
  thumbnail_url?: string | null
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

  const db = getAdminDb(tenantId)
  try {
    const res = await applyPresetToStore(
      tenantId,
      payload,
      {
        limits: { categories: opts.limits.categories ?? undefined, products: opts.limits.products ?? undefined },
        allowMultiLocation: opts.allowMultiLocation,
      },
      db,
    )
    // HU-236 v2: deja constancia de qué preset se aplicó para reanudar el wizard.
    try {
      await setOnboardingState({ presetApplied: presetKey, appliedAt: new Date().toISOString() }, db, tenantId)
    } catch { /* no bloquear el onboarding si falla la persistencia del estado */ }
    return { ok: true, result: res.results }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── HU-236 v2 · Onboarding reanudable con estado ────────────────────────────

export interface OnboardingChecklistItem {
  key: string
  label: string
  href: string
  done: boolean
}

export interface OnboardingProgress {
  state: OnboardingState
  /** Pasos contabilizados para el progreso (incluye preset + señales reales). */
  checklist: OnboardingChecklistItem[]
  completedCount: number
  totalCount: number
  percent: number
  /** El comerciante lo completó o lo omitió explícitamente. */
  finished: boolean
}

/** Señales derivadas de los datos reales de la tienda (plano store). */
export interface OnboardingSignals {
  presetApplied: boolean
  hasGeneral: boolean
  hasProducts: boolean
  hasCustomTheme: boolean
}

/**
 * Pura: arma el progreso del onboarding a partir del estado persistido + las
 * señales reales de la tienda. No consulta nada (testeable). El checklist
 * "duro" se deriva de datos, no se guarda, así nunca queda desincronizado.
 */
export function buildOnboardingProgress(
  state: OnboardingState | null,
  signals: OnboardingSignals,
): OnboardingProgress {
  const st: OnboardingState = state ?? {
    presetApplied: null, appliedAt: null, dismissed: false, completedAt: null,
  }
  const checklist: OnboardingChecklistItem[] = [
    { key: 'preset', label: 'Aplicar un punto de partida (preset)', href: '/onboarding', done: signals.presetApplied },
    { key: 'general', label: 'Datos generales y contacto', href: '/configuracion/general', done: signals.hasGeneral },
    { key: 'products', label: 'Cargar tus productos', href: '/productos', done: signals.hasProducts },
    { key: 'theme', label: 'Personalizar apariencia y tema', href: '/configuracion/temas', done: signals.hasCustomTheme },
  ]
  const completedCount = checklist.filter((c) => c.done).length
  const totalCount = checklist.length
  return {
    state: st,
    checklist,
    completedCount,
    totalCount,
    percent: Math.round((completedCount / totalCount) * 100),
    finished: st.completedAt != null || st.dismissed,
  }
}

/** Reúne las señales reales de la tienda y arma el progreso (HU-236 v2). */
export async function getOnboardingProgress(tenantId: string): Promise<OnboardingProgress> {
  const db = getAdminDb(tenantId)
  const [state, config, themes, products] = await Promise.all([
    getOnboardingState(db, tenantId).catch(() => null),
    getStoreConfig(db, tenantId).catch(() => null),
    getThemes(db).catch(() => []),
    getProducts({}, db).catch(() => [] as unknown[]),
  ])
  const hasGeneral = !!config && config.store_name.trim() !== '' && config.store_name !== 'Mi Tienda' && !!config.store_email
  const signals: OnboardingSignals = {
    presetApplied: !!state?.presetApplied,
    hasGeneral,
    hasProducts: products.length > 0,
    // Tema personalizado: existe algún tema que no sea el predeterminado sembrado.
    hasCustomTheme: themes.some((t) => !t.is_default),
  }
  return buildOnboardingProgress(state, signals)
}

/** Marca el onboarding como completado (HU-236 v2). */
export async function completeOnboarding(tenantId: string): Promise<void> {
  await setOnboardingState({ completedAt: new Date().toISOString() }, getAdminDb(tenantId), tenantId)
}

/** El comerciante omite el onboarding (HU-236 v2). */
export async function dismissOnboarding(tenantId: string): Promise<void> {
  await setOnboardingState({ dismissed: true }, getAdminDb(tenantId), tenantId)
}

/** Reabre el onboarding (limpia completado/omitido) (HU-236 v2). */
export async function reopenOnboarding(tenantId: string): Promise<void> {
  await setOnboardingState({ dismissed: false, completedAt: null }, getAdminDb(tenantId), tenantId)
}
