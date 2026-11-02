/**
 * /api/admin/inventory/items/[id]/adjust — E24 · HU-401
 * Ajuste manual de stock: anexa un movimiento de ajuste (entrada/salida) al libro.
 * Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { recordMovement, listUoms } from '@merkiai/database'
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
  const stockItemId = Number(id)
  if (!stockItemId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const direction = body?.direction === 'out' ? 'out' : body?.direction === 'in' ? 'in' : null
  const qty = Number(body?.qty)
  if (!direction || !(qty > 0)) return NextResponse.json({ error: 'Dirección (in/out) y cantidad (> 0) requeridas' }, { status: 400 })

  const db = getAdminDb(adminUser.tenantId)
  try {
    const uomId = body?.uom_id != null ? Number(body.uom_id) : null
    let factor = 1
    if (uomId != null) { const uoms = await listUoms(db); factor = uoms.find((u) => u.id === uomId)?.to_base_factor ?? 1 }
    await recordMovement(db, {
      tenant_id: adminUser.tenantId,
      stock_item_id: stockItemId,
      movement_type: 'adjustment',
      direction,
      qty,
      uom_id: uomId,
      uom_factor: factor,
      reason: (body?.reason as string)?.trim() || 'Ajuste manual',
      created_by: adminUser.displayName ?? null,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
