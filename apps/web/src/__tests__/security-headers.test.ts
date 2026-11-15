/**
 * Unit tests — cabeceras de seguridad (HU-062).
 * next.config aplica los headers de hardening a todas las rutas; la CSP la emite
 * el middleware con nonce por petición (src/lib/csp.ts).
 */
import nextConfig from '../../next.config'
import { contentSecurityPolicy } from '../lib/csp'

type HeaderPair = { key: string; value: string }

describe('security headers (next.config)', () => {
  it('aplica los headers de seguridad a todas las rutas', async () => {
    const rules = await nextConfig.headers!()
    expect(rules).toHaveLength(1)
    expect(rules[0].source).toBe('/(.*)')

    const map = Object.fromEntries(
      (rules[0].headers as HeaderPair[]).map((h) => [h.key, h.value]),
    )

    expect(map['Content-Security-Policy']).toBeUndefined() // la emite el middleware
    expect(map['X-Frame-Options']).toBe('DENY')
    expect(map['X-Content-Type-Options']).toBe('nosniff')
    expect(map['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(map['Strict-Transport-Security']).toContain('max-age=')
  })
  it('CSP con nonce y strict-dynamic, sin unsafe-eval fuera de desarrollo', () => {
    const csp = contentSecurityPolicy('n0nce')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("'nonce-n0nce'")
    expect(csp).toContain("'strict-dynamic'")
    expect(csp).toContain('frame-ancestors')
    expect(csp).toContain("object-src 'none'")
    if (process.env.NODE_ENV === 'production') expect(csp).not.toContain('unsafe-eval')
  })
})
