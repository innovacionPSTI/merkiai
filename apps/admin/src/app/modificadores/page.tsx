import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getProducts, listStockItems, listUoms } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import ModifiersManager from './ModifiersManager'

export const metadata: Metadata = { title: 'Modificadores' }
export const dynamic = 'force-dynamic'

/** E24 · Modificadores por producto (adiciones/opciones, HU-406). Cada opción
 *  puede ajustar el precio y, opcionalmente, consumir inventario al venderse. */
export default async function ModificadoresPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!(FLAGS.inventory || resolveFeature(entitlements, FEATURES.INVENTORY))) notFound()

  const [products, items, uoms] = await Promise.all([
    getProducts({}, db), listStockItems(db, { activeOnly: true }), listUoms(db),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Modificadores" description="Define grupos de adiciones y opciones por producto (p. ej. tamaño, extras). Cada opción puede ajustar el precio y descontar inventario al venderse." />
      <ModifiersManager
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        items={items.map((i) => ({ id: i.id, name: i.name, uom_id: i.uom_id }))}
        uoms={uoms.map((u) => ({ id: u.id, code: u.code }))}
      />
    </div>
  )
}
