import Link from 'next/link'
import type { Metadata } from 'next'
import { listBundles } from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'

export const metadata: Metadata = { title: 'Kits y paquetes' }
export const dynamic = 'force-dynamic'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

/** HU-168 · listado de bundles/kits activos del tenant (RLS filtra a activos). */
export default async function BundlesPage() {
  const db = await getRequestCatalogDb()
  const bundles = await listBundles(db).catch(() => [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-brand-primary text-3xl mb-6">Kits y paquetes</h1>
      {bundles.length === 0 ? (
        <p className="font-brand text-brand-primary/50">Aún no hay kits disponibles.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((b) => (
            <Link key={b.id} href={`/bundles/${b.slug}`} className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-brand-cream">
                {b.image_url && <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <p className="font-brand font-semibold text-brand-primary">{b.name}</p>
                <p className="font-brand text-brand-price font-bold mt-1">{fmt(b.price)}</p>
                <p className="font-brand text-xs text-brand-primary/40 mt-1">{b.components.length} producto(s) en el kit</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
