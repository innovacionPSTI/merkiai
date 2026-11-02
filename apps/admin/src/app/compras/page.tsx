import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listPurchases, listSuppliers, listStockItems, listUoms, getPurchaseItems } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import PurchasesManager from './PurchasesManager'

export const metadata: Metadata = { title: 'Compras' }
export const dynamic = 'force-dynamic'

/** E24 · Compras / proveedores (HU-402). Recibir una compra ingresa stock con costo. */
export default async function ComprasPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!(FLAGS.inventory || resolveFeature(entitlements, FEATURES.INVENTORY))) notFound()

  const [purchases, suppliers, items, uoms] = await Promise.all([
    listPurchases(db, { limit: 100 }), listSuppliers(db), listStockItems(db, { activeOnly: true }), listUoms(db),
  ])
  const supplierName = new Map(suppliers.map((s) => [s.id, s.name]))

  // Totales por compra (suma de sus líneas).
  const withTotals = await Promise.all(purchases.map(async (p) => {
    const lines = await getPurchaseItems(db, p.id)
    const total = lines.reduce((s, l) => s + l.qty * l.unit_cost, 0)
    return {
      id: p.id, reference: p.reference, status: p.status,
      supplier: p.supplier_id != null ? (supplierName.get(p.supplier_id) ?? '') : '',
      lines: lines.length, total,
    }
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Compras" description="Registra compras y recíbelas para que la mercancía entre al inventario con su costo." />
      <PurchasesManager
        initial={withTotals}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        items={items.map((i) => ({ id: i.id, name: i.name, uom_id: i.uom_id }))}
        uoms={uoms.map((u) => ({ id: u.id, code: u.code }))}
      />
    </div>
  )
}
