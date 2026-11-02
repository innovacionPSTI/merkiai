/**
 * /api/admin/inventory/modifiers/options — E24 · HU-406
 * POST → crea una opción dentro de un grupo de modificadores. La opción puede
 * ajustar el precio (price_delta) y opcionalmente consumir inventario al venderse.
 * Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createModifierOption } from '@merkiai/database'
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
  if (!body?.group_id || typeof body?.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Grupo y nombre de la opción son requeridos' }, { status: 400 })
  }
  try {
    const option = await createModifierOption(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      group_id: Number(body.group_id),
      name: body.name,
      price_delta: body.price_delta != null ? Number(body.price_delta) : 0,
      consume_stock_item_id: body.consume_stock_item_id ? Number(body.consume_stock_item_id) : null,
      consume_qty: body.consume_qty != null && body.consume_qty !== '' ? Number(body.consume_qty) : null,
      consume_uom_id: body.consume_uom_id ? Number(body.consume_uom_id) : null,
      order_index: body.order_index != null ? Number(body.order_index) : 0,
    })
    return NextResponse.json(option, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
