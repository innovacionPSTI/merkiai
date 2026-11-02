/**
 * /api/admin/price-lists/[id]/items — E24 · HU-407
 * GET  → precios de la lista.
 * POST → define/actualiza un precio por (producto) o (variante) (upsert).
 * Tenant-scoped + gated por `price_lists`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { getPriceListItems, setPriceListItem } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate(tenantId: string) {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) requireFeature(entitlements, FEATURES.PRICE_LISTS)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const listId = Number((await params).id)
  if (!listId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const items = await getPriceListItems(getAdminDb(adminUser.tenantId), listId)
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const listId = Number((await params).id)
  if (!listId) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  if (body?.price == null || Number(body.price) < 0) return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
  if (!body?.product_id && !body?.variant_id) return NextResponse.json({ error: 'Indica producto o variante' }, { status: 400 })
  try {
    const item = await setPriceListItem(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      price_list_id: listId,
      product_id: body.product_id ? Number(body.product_id) : null,
      variant_id: body.variant_id ? Number(body.variant_id) : null,
      price: Number(body.price),
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
