import { normalizeFromPath, normalizeToPath, validateRedirect, resolveRedirect } from '../redirects'

describe('redirects (HU-113)', () => {
  describe('normalizeFromPath', () => {
    it('agrega barra inicial, quita final, minúsculas, sin query/hash', () => {
      expect(normalizeFromPath('Ruta-Vieja/')).toBe('/ruta-vieja')
      expect(normalizeFromPath('/a//b/')).toBe('/a/b')
      expect(normalizeFromPath('/x?y=1#z')).toBe('/x')
      expect(normalizeFromPath('https://tienda.com/Vieja')).toBe('/vieja')
      expect(normalizeFromPath('/')).toBe('/')
      expect(normalizeFromPath('   ')).toBe('')
    })
  })

  describe('normalizeToPath', () => {
    it('conserva URL absoluta y normaliza la relativa', () => {
      expect(normalizeToPath('https://otro.com/x')).toBe('https://otro.com/x')
      expect(normalizeToPath('nueva')).toBe('/nueva')
      expect(normalizeToPath('/a//b')).toBe('/a/b')
    })
  })

  describe('validateRedirect', () => {
    it('acepta una regla simple y normaliza', () => {
      const v = validateRedirect({ from_path: '/Vieja/', to_path: 'nueva' })
      expect(v.ok).toBe(true)
      expect(v.from_path).toBe('/vieja')
      expect(v.to_path).toBe('/nueva')
      expect(v.status_code).toBe(301)
    })

    it('rechaza origen y destino iguales', () => {
      const v = validateRedirect({ from_path: '/x', to_path: '/x' })
      expect(v.ok).toBe(false)
    })

    it('rechaza duplicado de origen', () => {
      const v = validateRedirect({ from_path: '/x', to_path: '/y' }, [{ id: 1, from_path: '/x', to_path: '/z' }])
      expect(v.ok).toBe(false)
      expect(v.error).toMatch(/Ya existe/)
    })

    it('permite editar la misma regla (editingId)', () => {
      const v = validateRedirect({ from_path: '/x', to_path: '/y' }, [{ id: 1, from_path: '/x', to_path: '/z' }], 1)
      expect(v.ok).toBe(true)
    })

    it('detecta bucle directo destino→origen', () => {
      const v = validateRedirect({ from_path: '/a', to_path: '/b' }, [{ id: 1, from_path: '/b', to_path: '/a' }])
      expect(v.ok).toBe(false)
      expect(v.error).toMatch(/bucle/)
    })

    it('acepta 302 explícito', () => {
      const v = validateRedirect({ from_path: '/a', to_path: '/b', status_code: 302 })
      expect(v.status_code).toBe(302)
    })
  })

  describe('resolveRedirect', () => {
    const rules = [{ from_path: '/vieja', to_path: '/nueva', status_code: 301 }]
    it('resuelve ignorando mayúsculas y barra final', () => {
      expect(resolveRedirect('/Vieja/', rules)).toEqual({ to_path: '/nueva', status_code: 301 })
    })
    it('devuelve null si no hay regla', () => {
      expect(resolveRedirect('/otra', rules)).toBeNull()
    })
  })
})
