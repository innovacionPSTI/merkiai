import type { NextConfig } from 'next'

// ── Security headers ───────────────────────────────────────────────────────────

// CSP: la emite el middleware con nonce por petición (src/lib/csp.ts).

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

// ── Config ─────────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@merkiai/ui', '@merkiai/database'],

  // El barrel @merkiai/database re-exporta utilidades server-only (preview.ts →
  // node:crypto). Si un componente cliente lo arrastra (directa o transitivamente),
  // webpack falla con UnhandledSchemeError. Normalizamos el esquema `node:` y, en
  // el bundle de cliente, resolvemos `crypto` a vacío (esas funciones nunca se
  // llaman en cliente; el server conserva el crypto real).
  webpack: (config, { isServer, webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, '')
      }),
    )
    if (!isServer) {
      config.resolve = config.resolve ?? {}
      config.resolve.fallback = { ...(config.resolve.fallback ?? {}), crypto: false }
    }
    return config
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
