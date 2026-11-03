/**
 * /api/admin/inventory/backfill-stock — E18·HU-178 (Fase 3a)
 * POST → materializa el `product_variants.stock` actual como saldo de apertura
 * en el libro para las variantes enlazadas a un `stock_item`. Idempotente.
 * Tenant-scoped + gated por `inventory` + rol de datos.
 */
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { backfillOpeningStock, logAudit } from '@merkiai/database'
import { userCanManageData } from '@/lib/roles'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanManageData(adminUser)) return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.INVENTORY) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const db = getAdminDb(adminUser.tenantId)
  try {
    const res = await backfillOpeningStock(db)
    await logAudit(db, {
      tenantId: adminUser.tenantId, actorEmail: adminUser.email, actorRole: adminUser.role,
      action: 'inventory.backfill_opening', entity: 'stock_items',
      summary: `Backfill de saldo de apertura: ${res.applied} nuevos / ${res.items} ítems`, metadata: res,
    })
    return NextResponse.json(res)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
