import { stripLocalePrefix, switchHref } from '@/components/i18n/LocaleSwitcher'

describe('HU-462 · selector de idioma', () => {
  const codes = ['es-CO', 'en-US', 'es-MX']
  it('quita solo prefijos de idiomas publicados', () => {
    expect(stripLocalePrefix('/en-us/shop/t-shirt', codes)).toBe('/shop/t-shirt')
    expect(stripLocalePrefix('/en-us', codes)).toBe('/')
    expect(stripLocalePrefix('/fr-fr/shop', codes)).toBe('/fr-fr/shop')
    expect(stripLocalePrefix('/shop', codes)).toBe('/shop')
  })
  it('enlaza al cambio de idioma con la ruta sin prefijo', () => {
    expect(switchHref('es-MX', '/en-us/shop', codes)).toBe('/api/locale?set=es-MX&next=%2Fshop')
  })
})
