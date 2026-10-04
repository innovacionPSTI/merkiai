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
  /** HU-247 · 'light' | 'auto' | 'dark'. Ausente/desconocido ⇒ 'light'. */
  color_scheme?: string | null
  /** HU-247 · paleta oscura (override). Ausente ⇒ defaults cálidos. */
  dark_bg?: string | null
  dark_surface?: string | null
  dark_text?: string | null
  /** HU-247 · color del precio de producto. Ausente ⇒ usa el primario. */
  color_price?: string | null
}

/** Defaults de la paleta oscura (cálidos, acordes al sistema de color). */
export const DARK_DEFAULTS = {
  bg: '#1A1510',
  surface: '#241D15',
  text: '#F5EDE0',
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
  // HU-247 · el precio usa color_price si está, si no el primario.
  const price = theme.color_price || theme.color_primary

  const base = `:root {
  --brand-primary:     ${hexToRgb(theme.color_primary)};
  --brand-dark:        ${hexToRgb(theme.color_dark)};
  --brand-cream:       ${hexToRgb(theme.color_cream)};
  --brand-cream-warm:  ${hexToRgb(theme.color_cream_warm)};
  --brand-yellow:      ${hexToRgb(theme.color_yellow)};
  --brand-yellow-pale: ${hexToRgb(theme.color_yellow_pale)};
  --brand-text:        ${hexToRgb(theme.color_text)};
  --brand-price:       ${hexToRgb(price)};
  --font-display:      ${fontDisplay};
  --font-body:         ${fontBody};
}`

  // HU-247 · modo oscuro. 'light' (o ausente) no emite nada.
  const scheme = theme.color_scheme ?? 'light'
  if (scheme !== 'auto' && scheme !== 'dark') return base

  const darkVars = `  --brand-cream:       ${hexToRgb(theme.dark_bg || DARK_DEFAULTS.bg)};
  --brand-cream-warm:  ${hexToRgb(theme.dark_surface || DARK_DEFAULTS.surface)};
  --brand-text:        ${hexToRgb(theme.dark_text || DARK_DEFAULTS.text)};`

  // 'dark' → fuerza oscuro siempre; 'auto' → solo si el SO lo pide.
  const darkBlock = scheme === 'dark'
    ? `:root {\n${darkVars}\n}`
    : `@media (prefers-color-scheme: dark) {\n  :root {\n${darkVars}\n  }\n}`

  return `${base}\n${darkBlock}`
}
