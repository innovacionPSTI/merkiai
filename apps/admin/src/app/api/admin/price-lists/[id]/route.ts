/**
 * /api/admin/price-lists/[id] — E24 · HU-407 (PATCH)
 * Edita una lista de precio (nombre, ámbito, prioridad, activa).
 * Tenant-scoped + gated por `price_lists`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { updatePriceList, isPriceScopeType } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.PRICE_LISTS) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const { id } = await params
  const listId = Number(id)
  if (!listId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))

  const patch: Record<string, unknown> = {}
  if (typeof body?.name === 'string') patch.name = body.name.trim()
  if (typeof body?.scope_type === 'string' && isPriceScopeType(body.scope_type)) patch.scope_type = body.scope_type
  if ('scope_value' in body) patch.scope_value = body.scope_value ?? null
  if (body?.priority != null) patch.priority = Number(body.priority)
  if (typeof body?.active === 'boolean') patch.active = body.active
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  try {
    const list = await updatePriceList(getAdminDb(adminUser.tenantId), listId, patch)
    return NextResponse.json(list)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
