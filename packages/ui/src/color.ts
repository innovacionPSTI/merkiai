/**
 * Utilidades de color para accesibilidad (HU-247/HU-248). Puras y testeables.
 * Verificación de contraste WCAG 2.1 entre dos colores (hex).
 */

/** '#RRGGBB' | '#RGB' → {r,g,b} (0–255). null si no es un hex válido. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** Luminancia relativa (WCAG) de un color hex. 0 (negro) – 1 (blanco). */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b)
}

/** Ratio de contraste WCAG entre dos colores (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail'

/** Nivel WCAG a partir del ratio. `large` = texto grande (≥18pt / 14pt bold). */
export function contrastLevel(ratio: number, large = false): ContrastLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (large && ratio >= 3) return 'AA Large'
  return 'Fail'
}
