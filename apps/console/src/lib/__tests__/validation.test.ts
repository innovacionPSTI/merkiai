import { normalizeHost, isValidSubdomain, isValidHost } from '../validation'

describe('validation (console · seguridad)', () => {
  describe('normalizeHost', () => {
    it('minúsculas y sin puerto', () => {
      expect(normalizeHost('Demo.Merkiai.com:3000')).toBe('demo.merkiai.com')
    })
    it('trim y vacío', () => {
      expect(normalizeHost('  ')).toBe('')
      expect(normalizeHost(undefined as unknown as string)).toBe('')
    })
  })

  describe('isValidHost', () => {
    it('acepta hostnames legítimos', () => {
      expect(isValidHost('demo.merkiai.com')).toBe(true)
      expect(isValidHost('localhost')).toBe(true)
    })
    it('rechaza inyección en filtro PostgREST', () => {
      expect(isValidHost('a,subdomain.eq.x)')).toBe(false)
      expect(isValidHost('a b')).toBe(false)
      expect(isValidHost("x'or'1")).toBe(false)
      expect(isValidHost('')).toBe(false)
    })
  })

  describe('isValidSubdomain', () => {
    it('acepta a-z, 0-9, guion (2-40)', () => {
      expect(isValidSubdomain('demo')).toBe(true)
      expect(isValidSubdomain('mi-tienda-2')).toBe(true)
    })
    it('rechaza inválidos', () => {
      expect(isValidSubdomain('a')).toBe(false) // muy corto
      expect(isValidSubdomain('Con Mayus')).toBe(false)
      expect(isValidSubdomain('punto.com')).toBe(false)
      expect(isValidSubdomain('')).toBe(false)
    })
  })
})
