/**
 * /api/admin/inventory/purchases/[id]/receive — E24 · HU-402
 * Recibe una compra: anexa entradas al libro con costo e marca recibida.
 * Idempotente (receivePurchase usa op_key). Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { receivePurchase, listUoms } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const { id } = await params
  const purchaseId = Number(id)
  if (!purchaseId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })

  const db = getAdminDb(adminUser.tenantId)
  try {
    const uoms = await listUoms(db)
    const factorOf = new Map(uoms.map((u) => [u.id, u.to_base_factor]))
    const res = await receivePurchase(db, purchaseId, adminUser.tenantId, (uomId) => (uomId != null ? (factorOf.get(uomId) ?? 1) : 1))
    return NextResponse.json(res)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
