import type { Metadata, ResolvingMetadata } from 'next'
import { Suspense } from 'react'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { Analytics } from '@vercel/analytics/react'
import { stackServerApp } from '../stack'
import CartSyncOnLogin from '@/components/auth/CartSyncOnLogin'
import { buildThemeCSS } from '@/lib/theme-css'
import { getStoreContext } from '@/lib/store-context'
import { headers } from 'next/headers'
import './globals.css'

// ── Fuentes ───────────────────────────────────────────────────────────────────
// Se cargan por <link> de Google Fonts en runtime (NO next/font), para que el
// build no dependa de fonts.googleapis.com — ese fetch de build era intermitente
// y hacía fallar el deploy. Solo se cargan las 2 familias que el tema use.
const FONT_QUERY: Record<string, string> = {
  cormorant:    'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  playfair:     'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  lora:         'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  merriweather: 'Merriweather:ital,wght@0,300;0,400;0,700;1,400',
  'dm-sans':    'DM+Sans:wght@300;400;500;600;700',
  inter:        'Inter:wght@300;400;500;600;700',
  montserrat:   'Montserrat:wght@300;400;500;600;700',
  nunito:       'Nunito:wght@300;400;500;600;700',
}
const DISPLAY_FONTS = new Set(['cormorant', 'playfair', 'lora', 'merriweather'])
const BODY_FONTS = new Set(['dm-sans', 'inter', 'montserrat', 'nunito'])

/** URL de Google Fonts (css2) con solo las familias display+body seleccionadas. */
function googleFontsHref(displayId?: string | null, bodyId?: string | null): string {
  const d = displayId && DISPLAY_FONTS.has(displayId) ? displayId : 'cormorant'
  const b = bodyId && BODY_FONTS.has(bodyId) ? bodyId : 'dm-sans'
  const families = [FONT_QUERY[d], FONT_QUERY[b]].map((f) => `family=${f}`).join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

// ── Metadata ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata(_props: object, _parent: ResolvingMetadata): Promise<Metadata> {
  // HU-217: metadata (título/favicon/SEO) del contexto de tienda (por tenant).
  const { config } = await getStoreContext().catch(() => ({ config: null }))

  // HU-174 v2: la base para canónicas/OG es el HOST de la petición (dominio
  // propio o subdominio del tenant), no un NEXT_PUBLIC_SITE_URL fijo que
  // apuntaría siempre a una sola tienda. Fallback al env en dev/single-tenant.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const BASE_URL = host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  const storeName   = config?.store_name   ?? 'Tienda en línea'
  const description = config?.store_description ?? 'Bienvenido a nuestra tienda en línea. Explora nuestros productos y realiza tu pedido de forma segura.'
  const keywords    = config?.seo_keywords
    ? config.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : ['tienda online', 'ecommerce', 'compras en línea']

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description,
    keywords,
    metadataBase: BASE_URL ? new URL(BASE_URL) : undefined,
    openGraph: {
      locale: 'es_CO',
      type: 'website',
      siteName: storeName,
      ...(BASE_URL && { url: BASE_URL }),
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-default.jpg'],
    },
    robots: { index: true, follow: true },
    icons: config?.favicon_url
      ? { icon: config.favicon_url, shortcut: config.favicon_url }
      : undefined,
  }
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // HU-217: store_config + tema del contexto de tienda (por tenant, cacheado).
  const { config, theme } = await getStoreContext().catch(() => ({ config: null, theme: null }))

  const analyticsEnabled = config?.analytics_enabled ?? false
  const themeCSS = theme ? buildThemeCSS(theme) : null

  // Solo las 2 familias que el tema use (display + body).
  const fontsHref = googleFontsHref(theme?.font_display, theme?.font_body)

  return (
    <html lang="es">
      <head>
        {/* Fuentes del tema (Google Fonts en runtime; el build no depende de Google) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontsHref} />
        {/* Favicon dinámico desde store_config */}
        {config?.favicon_url && (
          <link rel="icon" href={config.favicon_url} />
        )}
        {/* Tema activo: sobreescribe las CSS vars definidas en globals.css */}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      </head>
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Suspense fallback={null}><CartSyncOnLogin /></Suspense>
            {children}
          </StackTheme>
        </StackProvider>
        {analyticsEnabled && <Analytics />}
      </body>
    </html>
  )
}
