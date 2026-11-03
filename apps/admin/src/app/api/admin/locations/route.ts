/**
 * /api/admin/locations — E18 · HU-176
 * GET  → ubicaciones del tenant.
 * POST → crea una ubicación. Tenant-scoped + gated por `multi_location`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { listLocations, createLocation, isLocationKind } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate(tenantId: string) {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) requireFeature(entitlements, FEATURES.MULTI_LOCATION)
}

export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const locations = await listLocations(getAdminDb(adminUser.tenantId))
  return NextResponse.json({ locations })
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const body = await req.json().catch(() => ({}))
  if (typeof body?.code !== 'string' || !body.code.trim() || typeof body?.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Código y nombre son requeridos' }, { status: 400 })
  }
  try {
    const location = await createLocation(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      code: body.code, name: body.name,
      kind: isLocationKind(body.kind) ? body.kind : 'warehouse',
      address: body.address ?? null, city: body.city ?? null, department: body.department ?? null,
      is_default: Boolean(body.is_default),
    })
    return NextResponse.json(location, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
