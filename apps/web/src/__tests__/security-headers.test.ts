/**
 * Unit tests — cabeceras de seguridad (HU-062).
 * Verifica que next.config aplica CSP y headers de hardening a todas las rutas.
 */
import nextConfig from '../../next.config'

type HeaderPair = { key: string; value: string }

describe('security headers (next.config)', () => {
  it('aplica los headers de seguridad a todas las rutas', async () => {
    const rules = await nextConfig.headers!()
    expect(rules).toHaveLength(1)
    expect(rules[0].source).toBe('/(.*)')

    const map = Object.fromEntries(
      (rules[0].headers as HeaderPair[]).map((h) => [h.key, h.value]),
    )

    expect(map['Content-Security-Policy']).toContain("default-src 'self'")
    expect(map['Content-Security-Policy']).toContain('frame-ancestors')
    expect(map['X-Frame-Options']).toBe('DENY')
    expect(map['X-Content-Type-Options']).toBe('nosniff')
    expect(map['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(map['Strict-Transport-Security']).toContain('max-age=')
  })
})
