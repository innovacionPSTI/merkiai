import type { NextConfig } from 'next'

// ── Security headers (hardening) ──────────────────────────────────────────────
// La consola es el plano de control: no se incrusta en ningún sitio, no carga
// scripts de terceros y solo habla con su Supabase y Stack Auth.
// CSP: la emite el middleware con nonce por petición (src/lib/csp.ts).

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  transpilePackages: ['@merkiai/tenancy', '@merkiai/ui', '@merkiai/i18n'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
