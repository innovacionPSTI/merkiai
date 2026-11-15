import { resolveLocaleRoute, buildAlternates, localizedPath, localizedUrl, type LocaleConfig } from '@/lib/locale-routing'

const config: LocaleConfig = { defaultLocale: 'es-CO', locales: ['es-CO', 'es-MX', 'en-US'], domains: [{ domain: 'mitienda.mx', locale: 'es-MX' }] }
const host = 'tienda.merkiai.com'

describe('HU-462 · resolveLocaleRoute', () => {
  it('AC-1 · el prefijo de un locale habilitado se sirve sin prefijo con ese locale', () => {
    expect(resolveLocaleRoute({ pathname: '/es-mx/shop/camiseta', host, config })).toEqual({ kind: 'rewrite', path: '/shop/camiseta', locale: 'es-MX' })
    expect(resolveLocaleRoute({ pathname: '/en-us', host, config })).toEqual({ kind: 'rewrite', path: '/', locale: 'en-US' })
  })

  it('AC-1 · un locale no habilitado no se trata como prefijo', () => {
    expect(resolveLocaleRoute({ pathname: '/es-es/shop', host, config })).toEqual({ kind: 'pass', locale: null })
  })

  it('AC-2 · el locale por defecto con prefijo responde 301 a la URL sin prefijo', () => {
    expect(resolveLocaleRoute({ pathname: '/es-co/shop', search: '?q=1', host, config })).toEqual({ kind: 'redirect', location: '/shop?q=1', status: 301 })
  })

  it('AC-6 · sin cookie no hay redirección (Accept-Language solo sugiere); con cookie elegida sí', () => {
    expect(resolveLocaleRoute({ pathname: '/shop', host, config })).toEqual({ kind: 'pass', locale: null })
    expect(resolveLocaleRoute({ pathname: '/shop', host, config, cookieLocale: 'en-US' })).toEqual({ kind: 'redirect', location: '/en-us/shop', status: 307 })
    expect(resolveLocaleRoute({ pathname: '/shop', host, config, cookieLocale: 'es-CO' })).toEqual({ kind: 'pass', locale: null })
    expect(resolveLocaleRoute({ pathname: '/shop', host, config, cookieLocale: 'fr-FR' })).toEqual({ kind: 'pass', locale: null })
  })

  it('AC-7 · el dominio de un mercado sirve su locale sin prefijo', () => {
    expect(resolveLocaleRoute({ pathname: '/shop', host: 'mitienda.mx', config })).toEqual({ kind: 'pass', locale: 'es-MX' })
    expect(resolveLocaleRoute({ pathname: '/es-mx/shop', host: 'mitienda.mx', config })).toEqual({ kind: 'redirect', location: '/shop', status: 301 })
    expect(resolveLocaleRoute({ pathname: '/es-co/shop', host: 'mitienda.mx', config })).toEqual({ kind: 'rewrite', path: '/shop', locale: 'es-CO' })
  })

  it('AC-8 · con un solo locale no hay prefijos', () => {
    const single = { ...config, locales: ['es-CO'], domains: [] }
    expect(resolveLocaleRoute({ pathname: '/en-us/shop', host, config: single })).toEqual({ kind: 'pass', locale: null })
  })
})

describe('HU-462 · URLs y alternates', () => {
  it('construye rutas y URLs por locale', () => {
    expect(localizedPath('/shop', 'en-US', host, config)).toBe('/en-us/shop')
    expect(localizedPath('/', 'en-US', host, config)).toBe('/en-us')
    expect(localizedPath('/shop', 'es-CO', host, config)).toBe('/shop')
    expect(localizedUrl('/shop', 'es-MX', 'https://tienda.merkiai.com', config)).toBe('https://mitienda.mx/shop')
  })

  it('AC-3/AC-4 · hreflang recíproco + x-default y canónica autorreferenciada', () => {
    const a = buildAlternates({ path: '/shop/camiseta', origin: 'https://tienda.merkiai.com', currentLocale: 'en-US', config })
    expect(a.canonical).toBe('https://tienda.merkiai.com/en-us/shop/camiseta')
    expect(a.languages).toEqual({
      'es-CO': 'https://tienda.merkiai.com/shop/camiseta',
      'es-MX': 'https://mitienda.mx/shop/camiseta',
      'en-US': 'https://tienda.merkiai.com/en-us/shop/camiseta',
      'x-default': 'https://tienda.merkiai.com/shop/camiseta',
    })
  })

  it('AC-3 · solo se anuncian las versiones con contenido propio', () => {
    const a = buildAlternates({ path: '/blog/x', origin: 'https://t.co', currentLocale: null, config, available: ['en-US'] })
    expect(Object.keys(a.languages ?? {})).toEqual(['es-CO', 'en-US', 'x-default'])
    const none = buildAlternates({ path: '/blog/x', origin: 'https://t.co', currentLocale: null, config, available: [] })
    expect(none.languages).toBeUndefined()
  })

  it('AC-8 · un solo locale: solo canónica', () => {
    expect(buildAlternates({ path: '/', origin: 'https://t.co', currentLocale: null, config: { defaultLocale: 'es-CO', locales: ['es-CO'], domains: [] } })).toEqual({ canonical: 'https://t.co' })
  })
})
