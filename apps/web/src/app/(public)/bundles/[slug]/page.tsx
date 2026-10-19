import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getBundleWithComponents, bundleMaxQty, componentsListPrice, bundleSavings } from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import AddBundleButton from '@/components/shop/AddBundleButton'

interface Props { params: Promise<{ slug: string }> }

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const b = await getBundleWithComponents(slug, await getRequestCatalogDb()).catch(() => null)
  return b ? { title: b.name } : {}
}

export const dynamic = 'force-dynamic'

/** HU-168 · detalle de un bundle con disponibilidad (componente más restrictivo). */
export default async function BundleDetailPage({ params }: Props) {
  const { slug } = await params
  const db = await getRequestCatalogDb()
  const bundle = await getBundleWithComponents(slug, db).catch(() => null)
  if (!bundle || !bundle.active) notFound()

  const maxQty = bundleMaxQty(bundle.components)
  const available = maxQty > 0
  const listPrice = componentsListPrice(bundle.components)
  const savings = bundleSavings(bundle.price, bundle.components)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-brand-cream overflow-hidden">
          {bundle.image_url && <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />}
        </div>
        <div>
          <h1 className="font-display text-brand-primary text-3xl mb-2">{bundle.name}</h1>
          {bundle.description && <p className="font-brand text-brand-primary/60 text-sm mb-4">{bundle.description}</p>}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-brand text-brand-price font-bold text-3xl">{fmt(bundle.price)}</span>
            {savings > 0 && <span className="font-brand text-brand-primary/40 line-through">{fmt(listPrice)}</span>}
          </div>
          {savings > 0 && <p className="font-brand text-sm text-green-600 mb-4">Ahorras {fmt(savings)} vs. comprarlos por separado</p>}

          <div className="rounded-xl border border-brand-primary/10 p-4 mb-5">
            <p className="font-brand text-xs uppercase tracking-wide text-brand-primary/50 mb-2">Incluye</p>
            <ul className="space-y-1">
              {bundle.components.map((c) => (
                <li key={c.variant_id} className="font-brand text-sm text-brand-primary flex justify-between">
                  <span>{c.product_name ?? `Variante ${c.variant_id}`}</span>
                  <span className="text-brand-primary/50">×{c.qty}</span>
                </li>
              ))}
            </ul>
          </div>

          {available ? (
            <AddBundleButton
              bundle={{
                id: bundle.id, slug: bundle.slug, name: bundle.name, price: bundle.price, maxQty,
                imageUrl: bundle.image_url,
              }}
            />
          ) : (
            <p className="font-brand text-sm text-red-500">Kit no disponible por falta de stock de uno de sus productos.</p>
          )}
        </div>
      </div>
    </div>
  )
}
