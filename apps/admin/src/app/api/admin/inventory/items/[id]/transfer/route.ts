/**
 * /api/admin/inventory/items/[id]/transfer — E18·HU-181
 * POST → transfiere stock del ítem entre dos ubicaciones (dos movimientos en el
 * libro). Gated por `inventory` + `multi_location`. Tenant-scoped (RLS).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createTransfer, listUoms } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY); requireFeature(entitlements, FEATURES.MULTI_LOCATION) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const stockItemId = Number((await params).id)
  if (!stockItemId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const from = Number(body?.from_location_id)
  const to = Number(body?.to_location_id)
  const qty = Number(body?.qty)
  if (!from || !to) return NextResponse.json({ error: 'Origen y destino son requeridos' }, { status: 400 })
  if (!(qty > 0)) return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })

  const db = getAdminDb(adminUser.tenantId)
  // Resuelve el factor de la UoM indicada (si viene) para convertir a unidad base.
  let uomFactor = 1
  if (body?.uom_id) {
    const uom = (await listUoms(db)).find((u) => u.id === Number(body.uom_id))
    uomFactor = uom?.to_base_factor ?? 1
  }
  try {
    const transfer = await createTransfer(db, {
      tenant_id: adminUser.tenantId,
      stock_item_id: stockItemId,
      from_location_id: from,
      to_location_id: to,
      qty,
      uom_id: body?.uom_id ? Number(body.uom_id) : null,
      uom_factor: uomFactor,
      note: body?.note ?? null,
    })
    return NextResponse.json(transfer, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
