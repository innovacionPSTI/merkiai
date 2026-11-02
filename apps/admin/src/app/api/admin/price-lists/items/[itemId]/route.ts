/**
 * /api/admin/price-lists/items/[itemId] — E24 · HU-407 (DELETE)
 * Elimina un precio de lista. Tenant-scoped + gated por `price_lists`.
 */
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { deletePriceListItem } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.PRICE_LISTS) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const itemId = Number((await params).itemId)
  if (!itemId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  try {
    await deletePriceListItem(getAdminDb(adminUser.tenantId), itemId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
