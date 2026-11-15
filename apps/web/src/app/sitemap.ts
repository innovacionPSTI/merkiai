import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getProducts, getBlogPosts, availableLocales, slugForLocale } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import { getLocaleConfig } from '@/lib/request-locale'
import { localizedUrl } from '@/lib/locale-routing'

// Multi-tenant: el sitemap es por-tenant (resuelto por Host). Dinámico, sin cache.
export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]
type TrRow = { locale: string; slug: string | null }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL del host de la petición (el dominio/subdominio del tenant), no un
  // NEXT_PUBLIC_SITE_URL fijo que apuntaría a una sola tienda.
  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const BASE_URL = host ? `${proto}://${host}` : ''

  // E28 · HU-462 · una entrada por versión de idioma con sus alternas (xhtml:link).
  const config = await getLocaleConfig()
  const multi = config.locales.length > 1

  /** Entradas de una ruta en cada idioma disponible, todas con el mismo mapa de alternas. */
  function versions(pathOf: (locale: string) => string, available: string[], base: Omit<Entry, 'url'>): Entry[] {
    if (!multi) return [{ ...base, url: `${BASE_URL}${pathOf(config.defaultLocale) === '/' ? '' : pathOf(config.defaultLocale)}` }]
    const locs = config.locales.filter((l) => available.includes(l))
    const languages: Record<string, string> = {}
    for (const l of locs) languages[l] = localizedUrl(pathOf(l), l, BASE_URL, config)
    if (locs.length > 1) languages['x-default'] = localizedUrl(pathOf(config.defaultLocale), config.defaultLocale, BASE_URL, config)
    return locs.map((l) => ({ ...base, url: languages[l], ...(locs.length > 1 ? { alternates: { languages } } : {}) }))
  }

  const all = config.locales
  const staticRoutes: MetadataRoute.Sitemap = [
    ...versions(() => '/',        all, { lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 }),
    ...versions(() => '/shop',    all, { lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 }),
    ...versions(() => '/blog',    all, { lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 }),
    ...versions(() => '/terms',   all, { lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 }),
    ...versions(() => '/privacy', all, { lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 }),
  ]

  // Catálogo y blog del tenant resuelto (tenant-scoped vía ctx.db; nunca service-role).
  const ctx = await getStoreContext().catch(() => null)
  if (!ctx) return staticRoutes

  const [products, posts, productTr, postTr] = await Promise.all([
    getProducts(undefined, ctx.db).catch(() => []),
    getBlogPosts(undefined, ctx.db).catch(() => []),
    multi ? loadTranslations(ctx.db, 'product_translations', 'product_id') : Promise.resolve(new Map<number, TrRow[]>()),
    multi ? loadTranslations(ctx.db, 'blog_post_translations', 'post_id') : Promise.resolve(new Map<number, TrRow[]>()),
  ])

  const routes = (prefix: string, id: number, slug: string, idx: Map<number, TrRow[]>, base: Omit<Entry, 'url'>) => {
    if (!multi) return versions(() => `${prefix}/${slug}`, [config.defaultLocale], base)
    const rows = idx.get(id) ?? []
    // AC-3 · solo los idiomas con traducción propia (el por defecto siempre).
    const available = availableLocales(rows.map((r) => r.locale), config.locales, config.defaultLocale)
    return versions((l) => `${prefix}/${l === config.defaultLocale ? slug : slugForLocale(rows, l, slug)}`, available, base)
  }

  const productRoutes = products
    .filter((p) => p.slug && p.active)
    .flatMap((p) => routes('/shop', p.id, p.slug, productTr, { lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 }))

  const blogRoutes = posts
    .filter((p) => p.published && p.slug)
    .flatMap((p) => routes('/blog', p.id, p.slug, postTr, {
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [...staticRoutes, ...productRoutes, ...blogRoutes]
}

/** Traducciones (locale + slug) de toda la tienda, agrupadas por entidad. */
async function loadTranslations(db: unknown, table: string, fk: string): Promise<Map<number, TrRow[]>> {
  const out = new Map<number, TrRow[]>()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any).from(table).select(`${fk}, locale, slug`)
    for (const r of (data ?? []) as Array<Record<string, unknown>>) {
      const id = Number(r[fk])
      const list = out.get(id) ?? []
      list.push({ locale: String(r.locale), slug: (r.slug as string | null) ?? null })
      out.set(id, list)
    }
  } catch { /* sin traducciones */ }
  return out
}
