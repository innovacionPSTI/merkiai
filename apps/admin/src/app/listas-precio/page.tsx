import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getProducts, listPriceLists } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import PriceListsManager from './PriceListsManager'

export const metadata: Metadata = { title: 'Listas de precio' }
export const dynamic = 'force-dynamic'

/** E24 · Listas de precio por canal/ubicación/segmento (HU-407). El precio
 *  efectivo se resuelve por contexto; sin listas rige el precio actual. */
export default async function ListasPrecioPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!resolveFeature(entitlements, FEATURES.PRICE_LISTS)) notFound()

  const [lists, products] = await Promise.all([
    listPriceLists(db), getProducts({}, db),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Listas de precio" description="Define precios por canal (en línea/mostrador), sede o segmento de cliente. El precio efectivo se resuelve por contexto, por encima del precio único; sin listas aplica el precio actual." />
      <PriceListsManager
        lists={lists.map((l) => ({ id: l.id, key: l.key, name: l.name, scope_type: l.scope_type, scope_value: l.scope_value, priority: l.priority, active: l.active }))}
        products={products.map((p) => ({ id: p.id, name: p.name, base_price: p.min_price ?? null }))}
      />
    </div>
  )
}
