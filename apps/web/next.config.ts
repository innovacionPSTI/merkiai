import type { NextConfig } from 'next'

// ── Security headers ───────────────────────────────────────────────────────────

// HU-128 v3 · la vista previa del Constructor embebe la tienda en un iframe desde
// el admin. Para permitirlo (sin abrir el framing a terceros), se habilita el
// origen del admin vía `ADMIN_PREVIEW_ORIGIN` (p. ej. https://admin.merkiai.com).
// Si no se define, el framing sigue bloqueado ('none') y el preview va en pestaña nueva.
const ADMIN_ORIGIN = process.env.ADMIN_PREVIEW_ORIGIN?.trim()

// HU-432 · origen público de los archivos cuando el storage es R2/S3 (CDN/dominio del bucket).
const MEDIA_ORIGIN = (() => {
  try { return process.env.STORAGE_PUBLIC_BASE_URL ? new URL(process.env.STORAGE_PUBLIC_BASE_URL).origin : '' } catch { return '' }
})()

// CSP: la emite el middleware con nonce por petición (src/lib/csp.ts).

const SECURITY_HEADERS = [
  // XFO solo soporta DENY/SAMEORIGIN; con un origen de admin externo se delega en
  // `frame-ancestors` (CSP, que lo supersede). Sin admin configurado → DENY.
  ...(ADMIN_ORIGIN ? [] : [{ key: 'X-Frame-Options', value: 'DENY' }]),
  { key: 'X-Content-Type-Options',        value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',        value: 'on' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',            value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security',     value: 'max-age=63072000; includeSubDomains; preload' },
]

// ── Config ─────────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@merkiai/ui', '@merkiai/database', '@merkiai/i18n'],

  // Ver apps/admin: evita UnhandledSchemeError de `node:crypto` (preview.ts del
  // barrel) en bundles de cliente. Normaliza `node:` y stub de crypto en cliente.
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
      // HU-432 · archivos servidos desde R2/S3 (dominio público del bucket).
      ...(MEDIA_ORIGIN ? [{ protocol: 'https' as const, hostname: new URL(MEDIA_ORIGIN).hostname, pathname: '/**' }] : []),
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

  // Modo mantenimiento
  async redirects() {
    if (process.env.MAINTENANCE_MODE === 'true') {
      return [
        {
          source: '/((?!maintenance).*)',
          destination: '/maintenance',
          permanent: false,
        },
      ]
    }
    return []
  },
}

export default nextConfig
