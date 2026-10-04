import {
  normalizeDomain,
  isValidDomain,
  makeVerifyToken,
  expectedTxtName,
  expectedTxtValue,
  verifyTxt,
} from '../domain-verification'

describe('normalizeDomain', () => {
  it('quita esquema, ruta, puerto, www y punto final', () => {
    expect(normalizeDomain('HTTPS://WWW.Tienda.com/shop?a=1')).toBe('tienda.com')
    expect(normalizeDomain('tienda.com:443')).toBe('tienda.com')
    expect(normalizeDomain('tienda.com.')).toBe('tienda.com')
  })
})

describe('isValidDomain', () => {
  it('acepta FQDN válidos', () => {
    expect(isValidDomain('mitienda.co')).toBe(true)
    expect(isValidDomain('shop.mi-tienda.com.co')).toBe(true)
  })
  it('rechaza inválidos y dominios de la plataforma', () => {
    expect(isValidDomain('no-tld')).toBe(false)
    expect(isValidDomain('a b.com')).toBe(false)
    expect(isValidDomain('merkiai.com')).toBe(false)
    expect(isValidDomain('tienda.merkiai.com')).toBe(false)
  })
})

describe('makeVerifyToken', () => {
  it('genera 32 hex deterministas con rng inyectado', () => {
    const t = makeVerifyToken(() => 0.5)
    expect(t).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe('registro TXT esperado', () => {
  it('nombre y valor', () => {
    expect(expectedTxtName('https://www.tienda.com')).toBe('_merkiai-verify.tienda.com')
    expect(expectedTxtValue('abc123')).toBe('merkiai-domain-verification=abc123')
  })
})

describe('verifyTxt', () => {
  const token = 'deadbeef'
  it('acepta registros como strings', () => {
    expect(verifyTxt(['foo', 'merkiai-domain-verification=deadbeef'], token)).toBe(true)
  })
  it('acepta fragmentos (string[][]) y recorta espacios', () => {
    expect(verifyTxt([['merkiai-domain-', 'verification=deadbeef']], token)).toBe(true)
    expect(verifyTxt([['  merkiai-domain-verification=deadbeef  ']], token)).toBe(true)
  })
  it('rechaza token distinto o ausente', () => {
    expect(verifyTxt(['merkiai-domain-verification=otro'], token)).toBe(false)
    expect(verifyTxt([], token)).toBe(false)
  })
})
