import { getProductBySlug, getProducts, getStoreConfig } from '@merkiai/database'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductDetail from '@/components/shop/ProductDetail'
import { buildProductJsonLd } from '@/lib/json-ld'
import { getRequestCatalogDb } from '@/lib/tenant-db'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug, await getRequestCatalogDb()).catch(() => null)
  if (!product) return {}

  const title       = product.seo_title ?? product.name
  const description = product.seo_desc ?? product.description ?? undefined
  const firstImage  = product.images?.[0]
  const imageUrl    = firstImage?.url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: firstImage?.alt ?? title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  // E17/HU-156+157: catálogo tenant-scoped por RLS (rol anon) con el tenant
  // resuelto desde el Host. getStoreConfig sigue en service-role hasta convertir
  // los singletons a fila-por-tenant (cola de HU-156).
  const db = await getRequestCatalogDb()
  const [product, storeConfig] = await Promise.all([
    getProductBySlug(slug, db).catch(() => null),
    getStoreConfig().catch(() => null),
  ])
  if (!product) notFound()

  const related = await getProducts(undefined, db)
    .then((all) => all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 3))
    .catch(() => [])

  const trustBadges = (storeConfig?.trust_badges ?? []).filter((b) => b.enabled)

  // JSON-LD — Product schema (lógica pura en @/lib/json-ld)
  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    images: product.images,
    slug: product.slug,
    variants: product.variants,
    storeName: storeConfig?.store_name,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} related={related} trustBadges={trustBadges} />
    </>
  )
}
