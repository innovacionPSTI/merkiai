import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listBundles } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import BundlesManager from './BundlesManager'

export const metadata: Metadata = { title: 'Bundles' }
export const dynamic = 'force-dynamic'

/**
 * HU-168 · Bundles / kits de producto. Definición (componentes + precio) desde
 * el admin. La compra en el storefront y el descuento de stock por componente
 * es la Fase 2. Gated por la sección "productos".
 */
export default async function BundlesPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')

  const [bundles, variantsRes] = await Promise.all([
    listBundles(db),
    db.from('product_variants').select('id, label, products!inner(name)').eq('active', true).limit(500),
  ])
  const variants = (variantsRes.data ?? []).map((v: any) => {
    const p = Array.isArray(v.products) ? v.products[0] : v.products
    return { id: v.id as number, label: `${p?.name ?? 'Producto'}${v.label ? ` · ${v.label}` : ''}` }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bundles / kits"
        description="Vende varios productos como un paquete con precio propio. El stock se descuenta por componente al comprar (próximamente en la tienda)."
      />
      <BundlesManager initial={bundles} variants={variants} />
    </div>
  )
}
