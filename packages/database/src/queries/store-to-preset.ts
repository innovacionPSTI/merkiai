/**
 * HU-256 · Construir un PresetPayload a partir del estado de una tienda.
 *
 * Inverso de `applyPresetToStore` (HU-235): toma el Tema activo + las secciones
 * del home (con ítems) + el modelo de inventario y produce un `PresetPayload`
 * **re-aplicable**. El comerciante exporta esto como JSON; el operador lo importa
 * como preset en la consola (HU-233) y queda disponible en la galería (HU-250).
 *
 * Lógica pura y testeable (no toca BD).
 */
import type { PageSection, SectionItem } from '../types'
import type { PresetPayload } from './apply-preset'
import type { StarterSection, StarterSectionItem } from './seed'

/** Campos del Tema que viajan en el preset (paleta + tipografía + layout + dark + precio). */
export const PRESET_THEME_FIELDS = [
  'color_primary', 'color_dark', 'color_cream', 'color_cream_warm',
  'color_yellow', 'color_yellow_pale', 'color_text', 'color_price',
  'font_display', 'font_body',
  'color_scheme', 'dark_bg', 'dark_surface', 'dark_text', 'template',
] as const

function sectionToStarter(s: PageSection & { items?: SectionItem[] }): StarterSection {
  const items: StarterSectionItem[] = (s.items ?? []).map((it) => ({
    item_type: it.item_type,
    title: it.title ?? undefined,
    description: it.description ?? undefined,
    cta_text: it.cta_text ?? undefined,
    link_url: it.link_url ?? undefined,
    icon: it.icon ?? undefined,
    image_url: it.image_url ?? undefined,
    order_index: it.order_index,
    metadata: (it.metadata && typeof it.metadata === 'object') ? it.metadata as Record<string, unknown> : undefined,
  }))
  return {
    section_type: s.section_type,
    title: s.title ?? undefined,
    subtitle: s.subtitle ?? undefined,
    body: s.body ?? undefined,
    image_url: s.image_url ?? undefined,
    cta_label: s.cta_label ?? undefined,
    cta_url: s.cta_url ?? undefined,
    enabled: s.enabled,
    order_index: s.order_index,
    settings: (s.settings && typeof s.settings === 'object') ? s.settings as Record<string, unknown> : undefined,
    items: items.length ? items : undefined,
  }
}

export interface BuildPresetInput {
  theme?: Record<string, unknown> | null
  homeSections: (PageSection & { items?: SectionItem[] })[]
  inventoryModel?: 'single' | 'multi_location'
}

/** Arma el PresetPayload re-aplicable desde el estado de la tienda (pura). */
export function buildStorePresetPayload(input: BuildPresetInput): PresetPayload {
  const theme: Record<string, unknown> = {}
  if (input.theme) {
    for (const k of PRESET_THEME_FIELDS) {
      const v = (input.theme as Record<string, unknown>)[k]
      if (v !== undefined && v !== null) theme[k] = v
    }
  }
  const template = (input.theme?.template as string) || 'default'
  const home_sections = [...input.homeSections]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map(sectionToStarter)

  return {
    theme,
    template,
    home_sections,
    // El contenido de catálogo (categorías/productos) NO se empaqueta por defecto
    // para no arrastrar inventario real; el operador puede añadirlo en la consola.
    sample_categories: [],
    sample_products: [],
    inventory_model: input.inventoryModel ?? 'single',
  }
}
