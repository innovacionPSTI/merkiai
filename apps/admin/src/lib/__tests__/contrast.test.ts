import { contrastRatio, contrastLevel, hexToRgb } from '@merkiai/ui'

describe('contraste WCAG (HU-247/248)', () => {
  it('hexToRgb admite #RGB y #RRGGBB', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('nope')).toBeNull()
  })

  it('negro vs blanco = 21:1 (máximo)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('mismo color = 1:1', () => {
    expect(contrastRatio('#614A2A', '#614A2A')).toBeCloseTo(1, 5)
  })

  it('es simétrico', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(contrastRatio('#abcdef', '#123456'), 10)
  })

  it('niveles WCAG por ratio', () => {
    expect(contrastLevel(21)).toBe('AAA')
    expect(contrastLevel(5)).toBe('AA')
    expect(contrastLevel(3.2, true)).toBe('AA Large')
    expect(contrastLevel(3.2, false)).toBe('Fail')
    expect(contrastLevel(1.5)).toBe('Fail')
  })
})
