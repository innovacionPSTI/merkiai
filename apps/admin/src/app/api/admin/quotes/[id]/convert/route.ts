/**
 * /api/admin/quotes/[id]/convert — E24 · HU-408 (AC-1)
 * POST → convierte la cotización en una orden (pago manual, estado pending) y la
 * marca `converted`. Tenant-scoped + gated por `quotes`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { convertQuoteToOrder } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.QUOTES) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  try {
    const res = await convertQuoteToOrder(getAdminDb(adminUser.tenantId), id)
    return NextResponse.json({ order_number: res.order.order_number, order_id: res.order.id, quote: res.quote })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
