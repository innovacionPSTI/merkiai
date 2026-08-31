/**
 * Registry de bloques del home (HU-217).
 *
 * Cada tipo de sección (`page_sections.section_type`) mapea a un componente
 * "bloque" que recibe `{ section, data }`. La página se renderiza recorriendo un
 * **preset de layout** (orden de tipos) y pintando cada bloque por el registry.
 *
 * Agregar un **Template** = un nuevo preset (orden) + un registry con variantes,
 * SIN tocar el código de rutas. Los datos vienen del repositorio/contexto y se
 * reutilizan tal cual; solo cambia la presentación.
 */
import type { ComponentType } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { getWebHomeData } from '@merkiai/database'
import HeroCarousel from '@/components/home/HeroCarousel'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import ServicesSection from '@/components/home/ServicesSection'
import NewsletterSection from '@/components/home/NewsletterSection'

export type HomeData = Awaited<ReturnType<typeof getWebHomeData>>
export type HomeSection = HomeData['homeSections'][number]

export interface BlockProps {
  /** Fila de `page_sections` para este tipo (settings/items). Puede faltar. */
  section?: HomeSection
  /** Datos compartidos del home (productos/blog/bestSellers/categorías). */
  data: HomeData
}

export type HomeBlock = ComponentType<BlockProps>

// ── Bloques ────────────────────────────────────────────────────────────────

function HeroBlock({ section }: BlockProps) {
  return <HeroCarousel items={section?.items ?? []} />
}

function FeaturedBlock({ data }: BlockProps) {
  return <FeaturedProducts products={data.featuredProducts} />
}

function ServicesBlock({ section }: BlockProps) {
  return <ServicesSection items={section?.items ?? []} />
}

function BestSellersBlock({ data }: BlockProps) {
  const { bestSellers, categories } = data
  return (
    <section className="bg-brand-cream-warm py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="font-display text-brand-primary leading-none mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
              Tienda
            </h2>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="border-b border-brand-primary/15 pb-4">
                  <Link href={`/shop?categoria=${cat.slug}`} className="font-brand text-brand-primary hover:text-brand-dark transition-colors flex items-center gap-2">
                    → {cat.name}
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/shop" className="inline-block mt-8 bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors">
              Ver todos los productos →
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            {bestSellers.map((product) => (
              <Link
                key={product.product_id}
                href={product.slug ? `/shop/${product.slug}` : '/shop'}
                className="group aspect-square rounded-2xl bg-brand-yellow/30 overflow-hidden relative"
              >
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 45vw, 20vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-primary/10 font-display text-4xl">☕</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-primary/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-brand text-brand-cream text-xs font-medium truncate">{product.product_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HistoriaBlock({ section }: BlockProps) {
  const meta = section?.settings as Record<string, string> | null | undefined
  const title    = meta?.title    ?? 'Vivir para Servir'
  const subtitle = meta?.subtitle ?? 'Cada taza que preparamos lleva el compromiso de la excelencia y el cuidado desde el origen hasta tu mesa.'
  const ctaText  = meta?.cta_text ?? 'Conoce nuestra historia →'
  const ctaUrl   = meta?.cta_url  ?? '/nosotros'
  return (
    <section className="relative py-40 overflow-hidden bg-brand-dark">
      <div className="absolute inset-0 bg-brand-text/60" />
      <div className="relative z-10 text-center px-6">
        <h2 className="font-display text-brand-cream leading-none mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>{title}</h2>
        <p className="font-brand text-brand-cream/70 max-w-xl mx-auto mb-8">{subtitle}</p>
        <Link href={ctaUrl} className="inline-block border border-brand-cream text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-cream/10 transition-colors">{ctaText}</Link>
      </div>
    </section>
  )
}

function BlogPreviewBlock({ data }: BlockProps) {
  const posts = data.blogPosts
  if (posts.length === 0) return null
  return (
    <section className="py-24 bg-brand-yellow-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="lg:w-2/5 bg-brand-yellow rounded-3xl p-10 flex flex-col justify-between min-h-64">
            <h2 className="font-display text-brand-primary leading-none" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>Notas<br />de<br />Café</h2>
            <Link href="/blog" className="inline-block mt-6 border border-brand-primary text-brand-primary rounded-full px-6 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors">Ver más →</Link>
          </div>
          <div className="flex-1 space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="border-b border-brand-primary/15 pb-6 last:border-0">
                <p className="font-brand text-xs text-brand-primary/40 mb-1">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
                <h3 className="font-brand font-semibold text-brand-primary text-lg mb-2">{post.title}</h3>
                {post.excerpt && <p className="font-brand text-sm text-brand-primary/60 mb-3 line-clamp-2">{post.excerpt}</p>}
                <Link href={`/blog/${post.slug}`} className="font-brand text-sm text-brand-primary underline hover:no-underline">Leer más →</Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function NewsletterBlock() {
  return <NewsletterSection />
}

// ── Registry + preset ────────────────────────────────────────────────────────

const DEFAULT_BLOCKS: Record<string, HomeBlock> = {
  hero:              HeroBlock,
  featured_products: FeaturedBlock,
  services:          ServicesBlock,
  best_sellers:      BestSellersBlock,
  historia:          HistoriaBlock,
  blog_preview:      BlogPreviewBlock,
  newsletter:        NewsletterBlock,
}

/** Preset de layout por template: orden de tipos de bloque en el home. */
const HOME_LAYOUTS: Record<string, string[]> = {
  default: ['hero', 'featured_products', 'services', 'best_sellers', 'historia', 'blog_preview', 'newsletter'],
}

/** Registry de bloques para un template (hoy solo 'default'). */
export function getHomeBlocks(_template = 'default'): Record<string, HomeBlock> {
  return DEFAULT_BLOCKS
}

/** Orden de bloques del home para un template. */
export function getHomeLayout(template = 'default'): string[] {
  return HOME_LAYOUTS[template] ?? HOME_LAYOUTS.default
}
