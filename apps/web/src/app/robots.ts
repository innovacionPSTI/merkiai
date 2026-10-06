import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

// HU-174 v2: el sitemap referenciado usa el HOST del tenant (dominio propio o
// subdominio), no un NEXT_PUBLIC_SITE_URL fijo. Fallback al env en dev.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account/', '/checkout/', '/handler/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
