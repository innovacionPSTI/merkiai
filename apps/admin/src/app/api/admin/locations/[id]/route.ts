/**
 * /api/admin/locations/[id] — E18 · HU-176
 * PATCH → edita una ubicación o la marca como predeterminada (`is_default: true`).
 * Tenant-scoped + gated por `multi_location`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { updateLocation, setDefaultLocation, isLocationKind } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.MULTI_LOCATION) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const db = getAdminDb(adminUser.tenantId)
  const body = await req.json().catch(() => ({}))

  try {
    if (body?.is_default === true) {
      await setDefaultLocation(db, id, adminUser.tenantId)
      return NextResponse.json({ ok: true })
    }
    const patch: Record<string, unknown> = {}
    if (typeof body?.name === 'string') patch.name = body.name.trim()
    if (isLocationKind(body?.kind)) patch.kind = body.kind
    if ('address' in body) patch.address = body.address ?? null
    if ('city' in body) patch.city = body.city ?? null
    if ('department' in body) patch.department = body.department ?? null
    if (typeof body?.active === 'boolean') patch.active = body.active
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    const location = await updateLocation(db, id, patch)
    return NextResponse.json(location)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
