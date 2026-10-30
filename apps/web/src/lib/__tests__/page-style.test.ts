import { pageStyleVars, hasPageStyle, parsePageStyle } from '../page-style'

describe('page-style (HU-352)', () => {
  it('sin override = sin vars (cero regresión)', () => {
    expect(pageStyleVars(null)).toEqual({})
    expect(pageStyleVars({})).toEqual({})
    expect(hasPageStyle(null)).toBe(false)
  })

  it('acento re-tinta --brand-primary y --brand-dark', () => {
    const v = pageStyleVars({ accent: '#1e90ff' }) as Record<string, string>
    expect(v['--brand-primary']).toBeDefined()
    expect(v['--brand-primary']).toBe(v['--brand-dark'])
    expect(hasPageStyle({ accent: '#1e90ff' })).toBe(true)
  })

  it('acepta hex con o sin #', () => {
    const a = pageStyleVars({ accent: '1e90ff' }) as Record<string, string>
    const b = pageStyleVars({ accent: '#1e90ff' }) as Record<string, string>
    expect(a['--brand-primary']).toBe(b['--brand-primary'])
  })

  it('ignora valores inválidos', () => {
    expect(pageStyleVars({ accent: 'rojo' })).toEqual({})
    expect(pageStyleVars({ accent: '#123' })).toEqual({})
    expect(pageStyleVars('x')).toEqual({})
  })

  it('parsePageStyle tolera no-objetos', () => {
    expect(parsePageStyle(undefined)).toEqual({})
    expect(parsePageStyle(42)).toEqual({})
    expect(parsePageStyle({ accent: '#000000' })).toEqual({ accent: '#000000' })
  })
})
