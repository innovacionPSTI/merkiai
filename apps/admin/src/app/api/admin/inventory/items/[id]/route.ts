/**
 * /api/admin/inventory/items/[id] — E24 · HU-400 (PATCH)
 * Edita un ítem de inventario. Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { updateStockItemById } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const { id } = await params
  const itemId = Number(id)
  if (!itemId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))

  const patch: Record<string, unknown> = {}
  if (typeof body?.name === 'string') patch.name = body.name.trim()
  if (typeof body?.item_class === 'string') patch.item_class = body.item_class
  if ('uom_id' in body) patch.uom_id = body.uom_id ?? null
  if (typeof body?.sellable === 'boolean') patch.sellable = body.sellable
  if (typeof body?.active === 'boolean') patch.active = body.active
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  try {
    const item = await updateStockItemById(getAdminDb(adminUser.tenantId), itemId, patch)
    return NextResponse.json(item)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
