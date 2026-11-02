import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listStockItems, listUoms, listBoms, listProductionOrders } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import ProductionManager from './ProductionManager'

export const metadata: Metadata = { title: 'Producción' }
export const dynamic = 'force-dynamic'

/** E24 · Recetas (BOM) + órdenes de producción (HU-404/405). Completar una orden
 *  consume insumos y crea el terminado con su costo. */
export default async function ProduccionPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!(FLAGS.inventory || resolveFeature(entitlements, FEATURES.INVENTORY))) notFound()

  const [items, uoms, boms, orders] = await Promise.all([
    listStockItems(db, { activeOnly: true }), listUoms(db), listBoms(db), listProductionOrders(db, { limit: 100 }),
  ])
  const itemName = new Map(items.map((i) => [i.id, i.name]))

  return (
    <div className="space-y-6">
      <PageHeader title="Producción" description="Define recetas y registra órdenes de producción. Completar una orden consume los insumos y crea el producto terminado con su costo." />
      <ProductionManager
        items={items.map((i) => ({ id: i.id, name: i.name, uom_id: i.uom_id }))}
        uoms={uoms.map((u) => ({ id: u.id, code: u.code }))}
        boms={boms.map((b) => ({ id: b.id, output: itemName.get(b.output_stock_item_id) ?? '', policy: b.consumption_policy, yield_qty: b.yield_qty, name: b.name }))}
        orders={orders.map((o) => ({ id: o.id, output: itemName.get(o.output_stock_item_id) ?? '', planned: o.planned_qty, produced: o.produced_qty, status: o.status }))}
      />
    </div>
  )
}
