import { getProductBySlug, getProducts, getTemplateVariant, getVariantTypes, buildSwatchColorMap, getApprovedRatings, getApprovedReviewsPage, reviewStats, REVIEWS_PAGE_SIZE } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductDetail from '@/components/shop/ProductDetail'
import Reviews from '@/components/shop/Reviews'
import RecentlyViewed from '@/components/shop/RecentlyViewed'
import { buildProductJsonLd } from '@/lib/json-ld'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import { resolveGateForProduct } from '@/lib/vip-access'

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
  const [product, ctx] = await Promise.all([
    getProductBySlug(slug, db).catch(() => null),
    getStoreContext().catch(() => null),
  ])
  if (!product) notFound()
  const storeConfig = ctx?.config ?? null

  const related = await getProducts(undefined, db)
    .then((all) => all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 3))
    .catch(() => [])

  // HU-101 · estadística (estrellas/JSON-LD) desde ratings ligeros + primera
  // página de reseñas (HU-101 v2: paginación).
  const ratings = await getApprovedRatings(db, product.id).catch(() => [])
  const stats = reviewStats(ratings.map((rating) => ({ rating })))
  const firstPage = await getApprovedReviewsPage(db, product.id, REVIEWS_PAGE_SIZE, 0).catch(() => ({ reviews: [], total: 0 }))

  const trustBadges = (storeConfig?.trust_badges ?? []).filter((b) => b.enabled)
  const pdpVariant = getTemplateVariant(ctx?.template, 'product_detail')
  // HU-283/284: ampliación de galería y tipo de CTA resueltos por la plantilla
  // activa (se "visten" por tienda; cero lógica específica de nicho).
  const galleryVariant = getTemplateVariant(ctx?.template, 'product_gallery')
  const ctaVariant = getTemplateVariant(ctx?.template, 'product_cta')
  // HU-264: mapa de colores de swatch de la tienda.
  const colorMap = buildSwatchColorMap(await getVariantTypes(true, db).catch(() => []))

  // HU-290 · gating de acceso anticipado VIP (server-side). Resuelve si el
  // producto está dentro de una campaña viva y si el visitante tiene acceso.
  const gate = await resolveGateForProduct(product.id, product.category_id ?? null)

  // JSON-LD — Product schema (lógica pura en @/lib/json-ld)
  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    images: product.images,
    slug: product.slug,
    variants: product.variants,
    storeName: storeConfig?.store_name,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    rating: stats.count > 0 ? { average: stats.average, count: stats.count } : null,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail
        product={product}
        related={related}
        trustBadges={trustBadges}
        layoutVariant={pdpVariant}
        galleryVariant={galleryVariant}
        ctaVariant={ctaVariant}
        colorMap={colorMap}
        showEstimator={!!storeConfig?.pdp_shipping_estimator}
        showShare={storeConfig?.pdp_share_enabled ?? true}
        vipLocked={gate.status === 'locked'}
        vipMember={gate.status === 'vip_member'}
        vipCampaign={gate.campaign ? { name: gate.campaign.name, ends_at: gate.campaign.ends_at } : undefined}
      />
      <Reviews productId={product.id} stats={stats} initialReviews={firstPage.reviews} total={firstPage.total} />
      {(storeConfig?.pdp_recommendations ?? true) && (
        <RecentlyViewed
          current={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            imageUrl: product.images?.[0]?.url ?? null,
            price: product.variants?.filter((v) => v.active).map((v) => v.price).sort((a, b) => a - b)[0] ?? null,
          }}
        />
      )}
    </>
  )
}
