import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listStockItems, listUoms, getAvailableMap, getItemCostMap } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import InventoryManager from './InventoryManager'

export const metadata: Metadata = { title: 'Inventario' }
export const dynamic = 'force-dynamic'

/**
 * E24 · Inventario — lista los ítems de inventario con su **disponible** (proyección
 * del libro de movimientos, HU-401), **costo** (promedio ponderado, HU-403) y unidad
 * de medida. Gated por el entitlement `inventory` (o el flag de dev). Acceso por la
 * sección "productos".
 */
export default async function InventarioPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')

  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  const enabled = FLAGS.inventory || resolveFeature(entitlements, FEATURES.INVENTORY)
  if (!enabled) notFound()

  const [items, uoms] = await Promise.all([listStockItems(db), listUoms(db)])
  const ids = items.map((i) => i.id)
  const [availableMap, costMap] = await Promise.all([getAvailableMap(db, ids), getItemCostMap(db, ids)])
  const uomCode = new Map(uoms.map((u) => [u.id, u.code]))

  const rows = items.map((it) => ({
    id: it.id,
    key: it.key,
    name: it.name,
    item_class: it.item_class,
    uom: it.uom_id != null ? (uomCode.get(it.uom_id) ?? '') : '',
    sellable: it.sellable,
    active: it.active,
    available: availableMap[it.id] ?? 0,
    cost: costMap[it.id] ?? null,
  }))

  const uomOptions = uoms.map((u) => ({ id: u.id, code: u.code, name: u.name }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Ítems de inventario con su disponible, costo y unidad de medida. El disponible proviene del libro de movimientos."
      />
      <InventoryManager initial={rows} uoms={uomOptions} />
    </div>
  )
}
