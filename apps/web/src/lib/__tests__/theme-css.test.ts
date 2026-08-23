import { buildThemeCSS, hexToRgb, FONT_DISPLAY_MAP, FONT_BODY_MAP } from '../theme-css'

const baseTheme = {
  color_primary: '#112233',
  color_dark: '#000000',
  color_cream: '#ffffff',
  color_cream_warm: '#fef9f0',
  color_yellow: '#ffcc00',
  color_yellow_pale: '#fff7cc',
  color_text: '#222222',
  font_display: 'cormorant',
  font_body: 'dm-sans',
}

describe('hexToRgb', () => {
  it('convierte hex a canales RGB', () => {
    expect(hexToRgb('#112233')).toBe('17 34 51')
    expect(hexToRgb('ffffff')).toBe('255 255 255')
  })
})

describe('buildThemeCSS — fuentes de tema (HU-081)', () => {
  it('mapea cada fuente display soportada', () => {
    for (const font of Object.keys(FONT_DISPLAY_MAP)) {
      const css = buildThemeCSS({ ...baseTheme, font_display: font })
      expect(css).toContain(`--font-display:      ${FONT_DISPLAY_MAP[font]};`)
    }
  })

  it('mapea cada fuente body soportada', () => {
    for (const font of Object.keys(FONT_BODY_MAP)) {
      const css = buildThemeCSS({ ...baseTheme, font_body: font })
      expect(css).toContain(`--font-body:         ${FONT_BODY_MAP[font]};`)
    }
  })

  it('usa Lora / Nunito cuando se seleccionan', () => {
    const css = buildThemeCSS({ ...baseTheme, font_display: 'lora', font_body: 'nunito' })
    expect(css).toContain('var(--font-lora)')
    expect(css).toContain('var(--font-nunito)')
  })

  it('cae a los valores por defecto ante una fuente desconocida', () => {
    const css = buildThemeCSS({ ...baseTheme, font_display: 'inexistente', font_body: 'inexistente' })
    expect(css).toContain(FONT_DISPLAY_MAP.cormorant)
    expect(css).toContain(FONT_BODY_MAP['dm-sans'])
  })

  it('incluye los colores del tema como canales RGB', () => {
    const css = buildThemeCSS(baseTheme)
    expect(css).toContain('--brand-primary:     17 34 51;')
    expect(css).toContain('--brand-yellow:      255 204 0;')
  })
})
