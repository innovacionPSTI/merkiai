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
  accent?: string | null      // "#RRGGBB"
  container?: string | null   // reservado (ancho de contenedor) — pendiente
  space?: string | null       // reservado (escala de espaciado) — pendiente
}

const HEX6 = /^#?[0-9a-fA-F]{6}$/

export function parsePageStyle(raw: unknown): PageStyle {
  return raw && typeof raw === 'object' ? (raw as PageStyle) : {}
}

/** CSS vars a aplicar en el wrapper de la página (vacío si no hay override). */
export function pageStyleVars(raw: unknown): CSSProperties {
  const s = parsePageStyle(raw)
  const out: Record<string, string> = {}
  if (typeof s.accent === 'string' && HEX6.test(s.accent)) {
    const rgb = hexToRgb(s.accent.startsWith('#') ? s.accent : `#${s.accent}`)
    out['--brand-primary'] = rgb
    out['--brand-dark'] = rgb
  }
  return out as CSSProperties
}

/** True si la página tiene algún override de estilo efectivo. */
export function hasPageStyle(raw: unknown): boolean {
  return Object.keys(pageStyleVars(raw)).length > 0
}
