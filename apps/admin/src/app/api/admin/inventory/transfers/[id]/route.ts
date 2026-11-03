/**
 * /api/admin/inventory/transfers/[id] — E18·HU-180 (AC-3)
 * PATCH { action: 'receive' | 'cancel' } → recibe en destino o cancela (reingreso
 * al origen) una transferencia en tránsito. Gated por `inventory` + `multi_location`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { receiveTransfer, cancelTransfer } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY); requireFeature(entitlements, FEATURES.MULTI_LOCATION) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const db = getAdminDb(adminUser.tenantId)
  try {
    const t = body?.action === 'cancel' ? await cancelTransfer(db, id)
      : body?.action === 'receive' ? await receiveTransfer(db, id)
      : null
    if (!t) return NextResponse.json({ error: 'action inválida (receive|cancel)' }, { status: 400 })
    return NextResponse.json(t)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
