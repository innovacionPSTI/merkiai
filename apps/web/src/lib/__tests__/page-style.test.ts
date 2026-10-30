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

  it('container token → --page-max', () => {
    expect((pageStyleVars({ container: 'xl' }) as Record<string, string>)['--page-max']).toBe('96rem')
    expect((pageStyleVars({ container: 'full' }) as Record<string, string>)['--page-max']).toBe('100%')
  })

  it('space token → --page-space', () => {
    expect((pageStyleVars({ space: 'relaxed' }) as Record<string, string>)['--page-space']).toBe('2.5rem')
  })

  it('tokens inválidos de container/space se ignoran', () => {
    expect(pageStyleVars({ container: 'enorme', space: 'poco' })).toEqual({})
  })

  it('combina acento + contenedor + espaciado', () => {
    const v = pageStyleVars({ accent: '#1e90ff', container: 'md', space: 'compact' }) as Record<string, string>
    expect(v['--brand-primary']).toBeDefined()
    expect(v['--page-max']).toBe('64rem')
    expect(v['--page-space']).toBe('0.75rem')
  })
})
