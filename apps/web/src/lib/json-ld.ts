/**
 * Constructores de datos estructurados JSON-LD (schema.org) para SEO.
 * Lógica pura y testeable, extraída de las páginas de producto y blog (HU-080).
 */

export interface ProductJsonLdInput {
  name: string
  description?: string | null
  images?: Array<{ url: string }> | null
  slug: string
  variants?: Array<{ price: number }> | null
  storeName?: string | null
  siteUrl?: string
}

/** Precio más bajo entre las variantes (o null si no hay). */
export function lowestVariantPrice(variants?: Array<{ price: number }> | null): number | null {
  if (!variants || variants.length === 0) return null
  return variants.reduce<number | null>((min, v) => (min === null || v.price < min ? v.price : min), null)
}

export function buildProductJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  const siteUrl = (input.siteUrl ?? '').replace(/\/$/, '')
  const url = `${siteUrl}/shop/${input.slug}`
  const price = lowestVariantPrice(input.variants)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.images?.length ? { image: input.images.map((img) => img.url) } : {}),
    url,
    ...(price !== null
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'COP',
            price,
            availability: 'https://schema.org/InStock',
            url,
          },
        }
      : {}),
    ...(input.storeName ? { brand: { '@type': 'Brand', name: input.storeName } } : {}),
  }
}

export interface ArticleJsonLdInput {
  title: string
  excerpt?: string | null
  cover_image?: string | null
  published_at?: string | null
  created_at: string
  slug: string
  storeName?: string | null
  logoUrl?: string | null
  siteUrl?: string
}

export function buildArticleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
  const siteUrl = (input.siteUrl ?? '').replace(/\/$/, '')
  const date = input.published_at ?? input.created_at
  const orgName = input.storeName ?? 'Merkiai'
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    ...(input.excerpt ? { description: input.excerpt } : {}),
    ...(input.cover_image ? { image: input.cover_image } : {}),
    datePublished: date,
    dateModified: date,
    url: `${siteUrl}/blog/${input.slug}`,
    author: { '@type': 'Organization', name: orgName, url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: orgName,
      url: siteUrl,
      ...(input.logoUrl ? { logo: { '@type': 'ImageObject', url: input.logoUrl } } : {}),
    },
  }
}
