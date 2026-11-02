/**
 * /api/admin/price-lists — E24 · HU-407
 * GET  → todas las listas de precio del tenant.
 * POST → crea una lista (key, name, ámbito, prioridad).
 * Tenant-scoped + gated por `price_lists`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { listPriceLists, createPriceList, isPriceScopeType } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate(tenantId: string) {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) requireFeature(entitlements, FEATURES.PRICE_LISTS)
}

export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const lists = await listPriceLists(getAdminDb(adminUser.tenantId))
  return NextResponse.json({ lists })
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const body = await req.json().catch(() => ({}))
  if (typeof body?.key !== 'string' || !body.key.trim() || typeof body?.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Clave y nombre son requeridos' }, { status: 400 })
  }
  const scope = typeof body?.scope_type === 'string' && isPriceScopeType(body.scope_type) ? body.scope_type : 'generic'
  try {
    const list = await createPriceList(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      key: body.key, name: body.name,
      scope_type: scope,
      scope_value: scope === 'generic' ? null : (body.scope_value ?? null),
      priority: body.priority != null ? Number(body.priority) : 0,
    })
    return NextResponse.json(list, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
