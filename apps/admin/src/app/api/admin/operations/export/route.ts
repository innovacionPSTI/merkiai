/**
 * /api/admin/operations/export — E24 · HU-409 (AC-1)
 * GET ?type=valuation|movements[&days=30] → CSV del tablero de operaciones.
 * Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { inventoryValuationRows, inventoryValuationToCsv, movementsSummarySince, movementsSummaryToCsv, listMovements, listUoms, kardexToCsv, listPurchases, listSuppliers, purchasesToCsv, listProductionOrders, listStockItems, productionOrdersToCsv } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }

  const db = getAdminDb(adminUser.tenantId)
  const type = req.nextUrl.searchParams.get('type') ?? 'valuation'
  const date = new Date().toISOString().slice(0, 10)
  let csv: string
  let filename: string

  if (type === 'kardex') {
    const itemId = Number(req.nextUrl.searchParams.get('item'))
    if (!itemId) return NextResponse.json({ error: 'item requerido' }, { status: 400 })
    const [movs, uoms] = await Promise.all([listMovements(db, { stockItemId: itemId, limit: 5000 }), listUoms(db)])
    const uomCode: Record<number, string> = {}
    for (const u of uoms) uomCode[u.id] = u.code
    csv = kardexToCsv(movs, uomCode)
    filename = `kardex-${itemId}-${date}.csv`
  } else if (type === 'purchases') {
    const [purchases, suppliers] = await Promise.all([listPurchases(db, { limit: 5000 }), listSuppliers(db)])
    const supplierName: Record<number, string> = {}
    for (const s of suppliers) supplierName[s.id] = s.name
    csv = purchasesToCsv(purchases, supplierName)
    filename = `compras-${date}.csv`
  } else if (type === 'production') {
    const [orders, items] = await Promise.all([listProductionOrders(db, { limit: 5000 }), listStockItems(db)])
    const itemName: Record<number, string> = {}
    for (const i of items) itemName[i.id] = i.name
    csv = productionOrdersToCsv(orders, itemName)
    filename = `produccion-${date}.csv`
  } else if (type === 'movements') {
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    csv = movementsSummaryToCsv(await movementsSummarySince(db, since))
    filename = `movimientos-${days}d-${date}.csv`
  } else {
    csv = inventoryValuationToCsv(await inventoryValuationRows(db))
    filename = `valorizacion-inventario-${date}.csv`
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
