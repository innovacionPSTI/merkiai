import { resolveSectionStyle, STYLE_FIELDS, SECTION_BG_TOKENS, SECTION_PAD_SCALE } from '../section-style'

describe('resolveSectionStyle (HU-253)', () => {
  it('sin settings → sin estilo (cero regresión)', () => {
    const s = resolveSectionStyle(undefined)
    expect(s.hasStyle).toBe(false)
    expect(s.bgClass).toBe('')
    expect(s.bgImage).toBeNull()
    expect(s.padTopClass).toBe('')
  })

  it('token de fondo válido → clase Tailwind', () => {
    const s = resolveSectionStyle({ style_bg: 'cream-warm' })
    expect(s.bgClass).toBe('bg-brand-cream-warm')
    expect(s.hasStyle).toBe(true)
  })

  it('token de fondo inválido → sin fondo', () => {
    expect(resolveSectionStyle({ style_bg: 'neon' }).bgClass).toBe('')
  })

  it('imagen de fondo gana sobre el color', () => {
    const s = resolveSectionStyle({ style_bg: 'primary', style_bg_image: 'https://x/y.jpg' })
    expect(s.bgImage).toBe('https://x/y.jpg')
    expect(s.bgClass).toBe('') // no se aplica color si hay imagen
  })

  it('escala de espaciado → clases pt/pb', () => {
    const s = resolveSectionStyle({ style_pad_top: 'large', style_pad_bottom: 'small' })
    expect(s.padTopClass).toBe('pt-28')
    expect(s.padBottomClass).toBe('pb-8')
    expect(s.hasStyle).toBe(true)
  })

  it('espaciado none → vacío', () => {
    expect(resolveSectionStyle({ style_pad_top: 'none' }).padTopClass).toBe('')
  })

  it('STYLE_FIELDS declara select de fondo/espaciado e imagen', () => {
    expect(STYLE_FIELDS.style_bg.type).toBe('select')
    expect(STYLE_FIELDS.style_bg_image.type).toBe('image')
    expect(Object.keys(SECTION_BG_TOKENS)).toContain('primary')
    expect(Object.keys(SECTION_PAD_SCALE)).toEqual(['none', 'small', 'medium', 'large'])
  })
})
