/**
 * HU-352 · estilo por página (overrides sobre el tema, por tokens).
 *
 * Cascada: tema global (HU-247) → override de página → fila/sección (HU-253).
 * Hoy aplica el **acento**: re-tinta las CSS vars `--brand-primary`/`--brand-dark`
 * SOLO en el wrapper de esa página (los bloques usan esos tokens → se re-tintan
 * sin tocar el layout). Sin override = hereda el tema (cero regresión).
 */
import type { CSSProperties } from 'react'
import { hexToRgb } from './theme-css'

export interface PageStyle {
  accent?: string | null      // "#RRGGBB" → re-tinta el primario
  container?: string | null   // ancho de contenedor: sm|md|lg|xl|full
  space?: string | null       // escala de espaciado: compact|normal|relaxed
}

const HEX6 = /^#?[0-9a-fA-F]{6}$/

/** Anchos de contenedor por token (lg = 80rem = el default actual max-w-7xl). */
export const CONTAINER_TOKENS: Record<string, string> = {
  sm: '48rem', md: '64rem', lg: '80rem', xl: '96rem', full: '100%',
}
/** Escala de espaciado por token (normal = 1.5rem = el gap-6 actual). */
export const SPACE_TOKENS: Record<string, string> = {
  compact: '0.75rem', normal: '1.5rem', relaxed: '2.5rem',
}

export function parsePageStyle(raw: unknown): PageStyle {
  return raw && typeof raw === 'object' ? (raw as PageStyle) : {}
}

/**
 * CSS vars a aplicar en el wrapper de la página (vacío si no hay override).
 * Cascada por tokens → los bloques/filas las consumen vía `var(--x, default)`,
 * de modo que sin override el render es idéntico (cero regresión).
 */
export function pageStyleVars(raw: unknown): CSSProperties {
  const s = parsePageStyle(raw)
  const out: Record<string, string> = {}
  if (typeof s.accent === 'string' && HEX6.test(s.accent)) {
    const rgb = hexToRgb(s.accent.startsWith('#') ? s.accent : `#${s.accent}`)
    out['--brand-primary'] = rgb
    out['--brand-dark'] = rgb
  }
  if (typeof s.container === 'string' && s.container in CONTAINER_TOKENS) {
    out['--page-max'] = CONTAINER_TOKENS[s.container]
  }
  if (typeof s.space === 'string' && s.space in SPACE_TOKENS) {
    out['--page-space'] = SPACE_TOKENS[s.space]
  }
  return out as CSSProperties
}

/** True si la página tiene algún override de estilo efectivo. */
export function hasPageStyle(raw: unknown): boolean {
  return Object.keys(pageStyleVars(raw)).length > 0
}
