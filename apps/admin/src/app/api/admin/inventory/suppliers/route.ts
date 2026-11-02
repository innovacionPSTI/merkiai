/**
 * /api/admin/inventory/suppliers — E24 · HU-402
 * Crea proveedores. Tenant-scoped (RLS) + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createSupplier, listSuppliers } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { adminUser: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return { adminUser: null, error: NextResponse.json({ error: e.message }, { status: 402 }) }; throw e }
  }
  return { adminUser, error: null }
}

export async function GET() {
  const { adminUser, error } = await gate()
  if (error) return error
  return NextResponse.json(await listSuppliers(getAdminDb(adminUser!.tenantId)))
}

export async function POST(req: NextRequest) {
  const { adminUser, error } = await gate()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body?.name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  try {
    const s = await createSupplier(getAdminDb(adminUser!.tenantId), {
      tenant_id: adminUser!.tenantId, name: body.name, email: body.email ?? null, phone: body.phone ?? null,
    })
    return NextResponse.json(s, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
