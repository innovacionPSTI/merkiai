/**
 * /api/admin/inventory/production — E24 · HU-405
 * Crea órdenes de producción (borrador). Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createProductionOrder } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const body = await req.json().catch(() => ({}))
  if (!body?.output_stock_item_id || !(Number(body?.planned_qty) > 0)) {
    return NextResponse.json({ error: 'Ítem de salida y cantidad planificada (> 0) son requeridos' }, { status: 400 })
  }
  try {
    const o = await createProductionOrder(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      output_stock_item_id: Number(body.output_stock_item_id),
      bom_id: body.bom_id ?? null,
      planned_qty: Number(body.planned_qty),
      notes: body.notes ?? null,
    })
    return NextResponse.json(o, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
