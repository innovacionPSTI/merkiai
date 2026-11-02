/**
 * /api/admin/inventory/items — E24 · HU-400
 *
 * Crea ítems de inventario (`stock_items`). Acotado por tenant vía RLS
 * (getAdminDb). Gated por el entitlement `inventory` (fail-open sin control-plane).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { createStockItem, listStockItems } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function requireAdmin() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { adminUser: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { adminUser, error: null }
}

export async function GET() {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  try {
    return NextResponse.json(await listStockItems(db))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { adminUser, error } = await requireAdmin()
  if (error) return error
  const db = getAdminDb(adminUser!.tenantId)
  const body = await req.json().catch(() => ({}))
  if (!body?.name) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  // E24 · gate del módulo de inventario (fail-open sin control-plane).
  const { entitlements } = await getTenantEntitlements(adminUser!.tenantId)
  if (entitlements) {
    try {
      requireFeature(entitlements, FEATURES.INVENTORY)
    } catch (e) {
      if (e instanceof EntitlementError) {
        return NextResponse.json({ error: e.message, code: e.code, key: e.key }, { status: 402 })
      }
      throw e
    }
  }

  try {
    const item = await createStockItem(db, {
      tenant_id: adminUser!.tenantId,
      key: body.key,
      name: body.name,
      item_class: body.item_class,
      uom_id: body.uom_id ?? null,
      sellable: body.sellable,
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
