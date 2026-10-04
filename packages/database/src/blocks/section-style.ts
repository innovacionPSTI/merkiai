/**
 * HU-253 · Grupo de estilo compartido por sección.
 *
 * Un conjunto de campos de estilo COMÚN a todos los bloques, persistido en
 * `page_sections.settings` con prefijo `style_`. El fondo usa **tokens del tema**
 * (no colores sueltos) para no romper la coherencia multi-tenant. La resolución
 * es pura y testeable; el storefront la convierte en clases/variables.
 *
 * Diseño conservador: todos los defaults son "sin efecto", así las secciones
 * existentes no cambian de conducta (el comerciante opta por el estilo).
 */
import type { BlockField } from './schema'

/** Tokens de fondo permitidos (de la paleta del tema) → clase Tailwind. */
export const SECTION_BG_TOKENS: Record<string, string> = {
  '':            '',                      // sin fondo (transparente)
  cream:         'bg-brand-cream',
  'cream-warm':  'bg-brand-cream-warm',
  'yellow-pale': 'bg-brand-yellow-pale',
  primary:       'bg-brand-primary',
  dark:          'bg-brand-dark',
}

/** Escala de espaciado vertical extra → clases Tailwind {top,bottom}. */
export const SECTION_PAD_SCALE: Record<string, { top: string; bottom: string }> = {
  none:   { top: '',        bottom: '' },
  small:  { top: 'pt-8',    bottom: 'pb-8' },
  medium: { top: 'pt-16',   bottom: 'pb-16' },
  large:  { top: 'pt-28',   bottom: 'pb-28' },
}

/** Campos de estilo compartidos (storage: settings, claves `style_*`). */
export const STYLE_FIELDS: Record<string, BlockField> = {
  style_bg: {
    label: 'Fondo', type: 'select', storage: 'settings', default: '',
    options: [
      { value: '',            label: 'Sin fondo' },
      { value: 'cream',       label: 'Crema' },
      { value: 'cream-warm',  label: 'Crema cálida' },
      { value: 'yellow-pale', label: 'Amarillo pálido' },
      { value: 'primary',     label: 'Primario' },
      { value: 'dark',        label: 'Oscuro' },
    ],
  },
  style_bg_image: { label: 'Imagen de fondo', type: 'image', storage: 'settings' },
  style_pad_top: {
    label: 'Espacio superior', type: 'select', storage: 'settings', default: 'none',
    options: [
      { value: 'none',   label: 'Ninguno' },
      { value: 'small',  label: 'Pequeño' },
      { value: 'medium', label: 'Medio' },
      { value: 'large',  label: 'Grande' },
    ],
  },
  style_pad_bottom: {
    label: 'Espacio inferior', type: 'select', storage: 'settings', default: 'none',
    options: [
      { value: 'none',   label: 'Ninguno' },
      { value: 'small',  label: 'Pequeño' },
      { value: 'medium', label: 'Medio' },
      { value: 'large',  label: 'Grande' },
    ],
  },
}

export interface SectionStyle {
  bgClass: string
  bgImage: string | null
  padTopClass: string
  padBottomClass: string
  /** Hay algún estilo aplicado (para que el storefront decida si envuelve). */
  hasStyle: boolean
}

/** Resuelve el estilo de una sección desde sus `settings` (pura, tolerante). */
export function resolveSectionStyle(settings: unknown): SectionStyle {
  const s = (settings && typeof settings === 'object') ? settings as Record<string, unknown> : {}
  const bgKey = typeof s.style_bg === 'string' && s.style_bg in SECTION_BG_TOKENS ? s.style_bg : ''
  const bgImage = typeof s.style_bg_image === 'string' && s.style_bg_image.trim() ? s.style_bg_image : null
  const padTop = SECTION_PAD_SCALE[(s.style_pad_top as string) ?? 'none'] ?? SECTION_PAD_SCALE.none
  const padBottom = SECTION_PAD_SCALE[(s.style_pad_bottom as string) ?? 'none'] ?? SECTION_PAD_SCALE.none
  const bgClass = bgImage ? '' : (SECTION_BG_TOKENS[bgKey] ?? '')
  const hasStyle = !!bgClass || !!bgImage || !!padTop.top || !!padBottom.bottom
  return { bgClass, bgImage, padTopClass: padTop.top, padBottomClass: padBottom.bottom, hasStyle }
}
