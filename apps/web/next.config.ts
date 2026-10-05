import type { NextConfig } from 'next'

// ── Security headers ───────────────────────────────────────────────────────────

// HU-128 v3 · la vista previa del Constructor embebe la tienda en un iframe desde
// el admin. Para permitirlo (sin abrir el framing a terceros), se habilita el
// origen del admin vía `ADMIN_PREVIEW_ORIGIN` (p. ej. https://admin.merkiai.com).
// Si no se define, el framing sigue bloqueado ('none') y el preview va en pestaña nueva.
const ADMIN_ORIGIN = process.env.ADMIN_PREVIEW_ORIGIN?.trim()
const FRAME_ANCESTORS = ADMIN_ORIGIN ? `'self' ${ADMIN_ORIGIN}` : "'none'"

const CSP = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for hydration scripts; nonce-based CSP requires custom server
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com",
  // Stack Auth + Supabase + Vercel Analytics
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stack-auth.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
  "media-src 'self' https://*.supabase.co",
  `frame-ancestors ${FRAME_ANCESTORS}`,
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy',        value: CSP },
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
  transpilePackages: ['@merkiai/ui', '@merkiai/database'],

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
