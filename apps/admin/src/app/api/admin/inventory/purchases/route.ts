/**
 * /api/admin/inventory/purchases — E24 · HU-402
 * Crea compras (cabecera + líneas) en borrador. Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createPurchase } from '@merkiai/database'
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
  const items = Array.isArray(body?.items) ? body.items : []
  if (!items.length) return NextResponse.json({ error: 'La compra necesita al menos una línea' }, { status: 400 })
  try {
    const p = await createPurchase(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      supplier_id: body.supplier_id ?? null,
      reference: body.reference ?? null,
      items: items.map((it: { stock_item_id: number; qty: number; uom_id?: number | null; unit_cost?: number }) => ({
        stock_item_id: Number(it.stock_item_id),
        qty: Number(it.qty),
        uom_id: it.uom_id ?? null,
        unit_cost: Number(it.unit_cost ?? 0),
      })),
    })
    return NextResponse.json(p, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
