/**
 * /api/admin/inventory/production/[id]/complete — E24 · HU-405
 * Completa una orden: consume componentes y crea el terminado con costo del lote.
 * Idempotente (op_key). Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { completeProductionOrder, listUoms, listStockItems } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const { id } = await params
  const orderId = Number(id)
  if (!orderId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))

  const db = getAdminDb(adminUser.tenantId)
  try {
    const [uoms, items, { data: order }] = await Promise.all([
      listUoms(db), listStockItems(db), db.from('production_orders').select('output_stock_item_id').eq('id', orderId).maybeSingle(),
    ])
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    const factorOf = new Map(uoms.map((u) => [u.id, u.to_base_factor]))
    const itemUom = new Map(items.map((i) => [i.id, i.uom_id]))
    const outUomId = itemUom.get((order as { output_stock_item_id: number }).output_stock_item_id) ?? null
    const outputUomFactor = outUomId != null ? (factorOf.get(outUomId) ?? 1) : 1

    const res = await completeProductionOrder(db, orderId, adminUser.tenantId, {
      producedQty: body?.produced_qty != null ? Number(body.produced_qty) : undefined,
      uomFactorOf: (uomId) => (uomId != null ? (factorOf.get(uomId) ?? 1) : 1),
      outputUomFactor,
    })
    return NextResponse.json(res)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
