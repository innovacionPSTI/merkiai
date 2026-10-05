import type { NextConfig } from 'next'

// ── Security headers ───────────────────────────────────────────────────────────

// HU-128 v3 · el Constructor incrusta la tienda (subdominio del tenant) en el
// iframe de vista previa. Sin `frame-src`, el CSP del admin cae a default-src
// 'self' y bloquea el iframe. Se permite el dominio base del storefront.
const STOREFRONT_BASE = (process.env.STOREFRONT_BASE_DOMAIN ?? 'merkiai.com').trim()

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
  // Stack Auth + Supabase
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stack-auth.com",
  // Vista previa: permitir incrustar el storefront del tenant (subdominios).
  `frame-src 'self' https://*.${STOREFRONT_BASE}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy',    value: CSP },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

// ── Config ─────────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
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
