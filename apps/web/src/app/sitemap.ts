import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getProducts, getBlogPosts } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'

// Multi-tenant: el sitemap es por-tenant (resuelto por Host). Dinámico, sin cache.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL del host de la petición (el dominio/subdominio del tenant), no un
  // NEXT_PUBLIC_SITE_URL fijo que apuntaría a una sola tienda.
  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const BASE_URL = host ? `${proto}://${host}` : ''

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/shop`,    lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/blog`,    lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/terms`,   lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Catálogo y blog del tenant resuelto (tenant-scoped vía ctx.db; nunca service-role).
  const ctx = await getStoreContext().catch(() => null)
  if (!ctx) return staticRoutes

  const [products, posts] = await Promise.all([
    getProducts(undefined, ctx.db).catch(() => []),
    getBlogPosts(undefined, ctx.db).catch(() => []),
  ])

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.slug && p.active)
    .map((p) => ({ url: `${BASE_URL}/shop/${p.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 }))

  const blogRoutes: MetadataRoute.Sitemap = posts
    .filter((p) => p.published && p.slug)
    .map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [...staticRoutes, ...productRoutes, ...blogRoutes]
}
