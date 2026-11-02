/**
 * /api/admin/inventory/modifiers — E24 · HU-406
 * GET  ?product_id=…  → grupos de modificadores (con opciones) de un producto.
 * POST                → crea un grupo de modificadores para un producto.
 * Tenant-scoped + gated por `inventory`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { getProductModifiers, createModifierGroup } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate(tenantId: string) {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) requireFeature(entitlements, FEATURES.INVENTORY)
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const productId = Number(req.nextUrl.searchParams.get('product_id'))
  if (!productId) return NextResponse.json({ error: 'product_id requerido' }, { status: 400 })
  const groups = await getProductModifiers(getAdminDb(adminUser.tenantId), productId)
  return NextResponse.json({ groups })
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const body = await req.json().catch(() => ({}))
  if (!body?.product_id || typeof body?.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Producto y nombre del grupo son requeridos' }, { status: 400 })
  }
  try {
    const group = await createModifierGroup(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      product_id: Number(body.product_id),
      name: body.name,
      min_select: body.min_select != null ? Number(body.min_select) : 0,
      max_select: body.max_select != null ? Number(body.max_select) : 0,
      required: Boolean(body.required),
      order_index: body.order_index != null ? Number(body.order_index) : 0,
    })
    return NextResponse.json(group, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
