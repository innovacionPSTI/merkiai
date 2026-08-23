/**
 * Generación del bloque CSS del tema activo (colores + fuentes).
 * Lógica pura y testeable, extraída de `layout.tsx` (HU-081 fuentes de tema).
 * No importa `next/font` para poder probarse en Jest.
 */

export interface ThemeColors {
  color_primary: string
  color_dark: string
  color_cream: string
  color_cream_warm: string
  color_yellow: string
  color_yellow_pale: string
  color_text: string
  font_display: string
  font_body: string
}

/** Convierte hex #RRGGBB a canales RGB separados por espacios para CSS vars. */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

/** Identificador de fuente → valor de CSS var (display). */
export const FONT_DISPLAY_MAP: Record<string, string> = {
  cormorant:    'var(--font-ahsing), Georgia, serif',
  playfair:     'var(--font-playfair), Georgia, serif',
  lora:         'var(--font-lora), Georgia, serif',
  merriweather: 'var(--font-merriweather), Georgia, serif',
}

/** Identificador de fuente → valor de CSS var (body). */
export const FONT_BODY_MAP: Record<string, string> = {
  'dm-sans':   'var(--font-geeeki), system-ui, sans-serif',
  inter:       'var(--font-inter), system-ui, sans-serif',
  montserrat:  'var(--font-montserrat), system-ui, sans-serif',
  nunito:      'var(--font-nunito), system-ui, sans-serif',
}

/**
 * Bloque CSS que sobreescribe las CSS vars del tema activo. Los identificadores
 * de fuente desconocidos caen a los valores por defecto (cormorant / dm-sans).
 */
export function buildThemeCSS(theme: ThemeColors): string {
  const fontDisplay = FONT_DISPLAY_MAP[theme.font_display] ?? FONT_DISPLAY_MAP.cormorant
  const fontBody    = FONT_BODY_MAP[theme.font_body]       ?? FONT_BODY_MAP['dm-sans']

  return `:root {
  --brand-primary:     ${hexToRgb(theme.color_primary)};
  --brand-dark:        ${hexToRgb(theme.color_dark)};
  --brand-cream:       ${hexToRgb(theme.color_cream)};
  --brand-cream-warm:  ${hexToRgb(theme.color_cream_warm)};
  --brand-yellow:      ${hexToRgb(theme.color_yellow)};
  --brand-yellow-pale: ${hexToRgb(theme.color_yellow_pale)};
  --brand-text:        ${hexToRgb(theme.color_text)};
  --font-display:      ${fontDisplay};
  --font-body:         ${fontBody};
}`
}
