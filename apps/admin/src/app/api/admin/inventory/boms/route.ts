/**
 * /api/admin/inventory/boms — E24 · HU-404
 * Crea recetas (BOM). Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createBom } from '@merkiai/database'
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
  const components = Array.isArray(body?.components) ? body.components : []
  if (!body?.output_stock_item_id || !components.length) {
    return NextResponse.json({ error: 'Ítem de salida y al menos un componente son requeridos' }, { status: 400 })
  }
  try {
    const bom = await createBom(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      output_stock_item_id: Number(body.output_stock_item_id),
      name: body.name ?? null,
      consumption_policy: body.consumption_policy,
      yield_qty: body.yield_qty != null ? Number(body.yield_qty) : 1,
      components: components.map((c: { component_stock_item_id: number; qty: number; uom_id?: number | null }) => ({
        component_stock_item_id: Number(c.component_stock_item_id),
        qty: Number(c.qty),
        uom_id: c.uom_id ?? null,
      })),
    })
    return NextResponse.json(bom, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
