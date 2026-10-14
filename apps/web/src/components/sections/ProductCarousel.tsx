/**
 * ProductCarousel (HU-286 v2) — bloque CMS reutilizable de productos.
 *
 * Server component async: resuelve su fuente (destacados / más vendidos / nuevos
 * / categoría / manual) desde los settings de la sección y fetchea por RLS de
 * tenant. Insertable por el Constructor en cualquier página; estilos solo con
 * tokens de tema para "vestirse" según la plantilla de cada tienda.
 */
import Link from 'next/link'
import {
  resolveBlockFields,
  getCarouselProducts,
  parseSlugList,
  normalizeCarouselSource,
  type SectionLike,
} from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default async function ProductCarousel({
  section,
  template,
}: {
  section?: SectionLike | null
  template?: string
}) {
  const f = resolveBlockFields('product_carousel', section, template)
  const db = await getRequestCatalogDb().catch(() => null)
  if (!db) return null

  const products = await getCarouselProducts(db, {
    source: normalizeCarouselSource(f.source),
    categorySlug: (f.category_slug as string) ?? null,
    slugs: parseSlugList(f.product_slugs),
    limit: Number(f.limit) || 8,
  }).catch(() => [])

  if (products.length === 0) return null
  const title = (f.title as string) || 'Productos'

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="font-display text-brand-primary text-section mb-6">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {products.map((p) => (
          <Link
            key={p.id}
            href={p.slug ? `/shop/${p.slug}` : '/shop'}
            className="group shrink-0 w-44 snap-start bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="h-36 bg-brand-cream overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-brand-primary/10 text-3xl">▲</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-brand text-sm text-brand-primary truncate">{p.name}</p>
              {p.price != null && (
                <p className="font-brand font-bold text-brand-primary text-sm mt-0.5">{fmt(p.price)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
