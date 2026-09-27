/**
 * Lectura de Presets desde la BD de PLATAFORMA (control plane, service-role).
 * Ver HU-233 / ADR-002.
 */
import { platformDb } from './platform-db'
import type { InventoryModel } from './preset-validation'

export interface PresetRow {
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
  version: number
}

const COLS =
  'key, name, niche, description, theme, template, home_sections, sample_categories, sample_products, inventory_model, available_in_plans, active, version'

export async function getPresets(): Promise<PresetRow[]> {
  const { data } = await platformDb()
    .from('presets')
    .select(COLS)
    .order('niche', { ascending: true })
    .order('name', { ascending: true })
  return (data ?? []) as PresetRow[]
}

/** Presets aplicables a un plan: activos y (available_in_plans vacío = todos). */
export async function getPresetsForPlan(planKey: string): Promise<PresetRow[]> {
  const all = await getPresets()
  return all.filter(
    (p) => p.active && (p.available_in_plans.length === 0 || p.available_in_plans.includes(planKey)),
  )
}
