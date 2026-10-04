/**
 * Validación pura de Presets (HU-233). Sin dependencias de red/DB → testeable.
 * Ver ADR-002 para el vocabulario (Preset = bundle curado por nicho).
 */
export const PRESET_KEY_RE = /^[a-z0-9-]{2,40}$/
export const NICHE_RE = /^[a-z0-9-]{2,30}$/
export const INVENTORY_MODELS = ['single', 'multi_location'] as const
export type InventoryModel = (typeof INVENTORY_MODELS)[number]

export interface PresetInput {
  key: string
  name: string
  niche: string
  description: string | null
  theme: Record<string, unknown>
  template: string
  home_sections: unknown[]
  sample_categories: unknown[]
  sample_products: unknown[]
  inventory_model: InventoryModel
  available_in_plans: string[]
  active: boolean
  /** HU-257 · URL de la miniatura (null = placeholder en la galería). */
  thumbnail_url: string | null
}

/** '' → {}. null si no es objeto JSON. */
export function parseJsonObject(raw: string | undefined | null): Record<string, unknown> | null {
  if (!raw || !raw.trim()) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** '' → []. null si no es array JSON. */
export function parseJsonArray(raw: string | undefined | null): unknown[] | null {
  if (!raw || !raw.trim()) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

/** 'free, pro' → ['free','pro']; vacío → []. */
export function parsePlanList(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export interface PresetFormFields {
  key?: string
  name?: string
  niche?: string
  description?: string
  theme?: string
  template?: string
  home_sections?: string
  sample_categories?: string
  sample_products?: string
  inventory_model?: string
  available_in_plans?: string
  active?: string
  thumbnail_url?: string
}

export function parsePresetForm(
  f: PresetFormFields,
): { ok: true; value: PresetInput } | { ok: false; error: string } {
  const key = (f.key ?? '').trim().toLowerCase()
  if (!PRESET_KEY_RE.test(key)) return { ok: false, error: 'key inválida (a-z, 0-9, -, 2-40)' }

  const name = (f.name ?? '').trim()
  if (!name) return { ok: false, error: 'nombre requerido' }

  const niche = (f.niche ?? '').trim().toLowerCase()
  if (!NICHE_RE.test(niche)) return { ok: false, error: 'nicho inválido (a-z, 0-9, -, 2-30)' }

  const theme = parseJsonObject(f.theme)
  if (!theme) return { ok: false, error: 'theme debe ser un objeto JSON' }

  const home_sections = parseJsonArray(f.home_sections)
  if (!home_sections) return { ok: false, error: 'home_sections debe ser un array JSON' }
  const sample_categories = parseJsonArray(f.sample_categories)
  if (!sample_categories) return { ok: false, error: 'sample_categories debe ser un array JSON' }
  const sample_products = parseJsonArray(f.sample_products)
  if (!sample_products) return { ok: false, error: 'sample_products debe ser un array JSON' }

  const inventory_model = (f.inventory_model ?? 'single') as InventoryModel
  if (!INVENTORY_MODELS.includes(inventory_model)) return { ok: false, error: 'inventory_model inválido' }

  return {
    ok: true,
    value: {
      key,
      name,
      niche,
      description: (f.description ?? '').trim() || null,
      theme,
      template: (f.template ?? 'default').trim() || 'default',
      home_sections,
      sample_categories,
      sample_products,
      inventory_model,
      available_in_plans: parsePlanList(f.available_in_plans),
      active: f.active !== 'false',
      thumbnail_url: (f.thumbnail_url ?? '').trim() || null,
    },
  }
}
