/**
 * GET /api/admin/receivables/export — E27 · HU-456
 * CSV de cartera (documentos con su saldo) para el contador. Tenant-scoped (RLS)
 * y gated por la feature `receivables`.
 */
import { NextResponse } from 'next/server'
import { listReceivableDocuments, receivablesToCsv } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { getTenantEntitlements, resolveFeature, FEATURES } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId).catch(() => ({ entitlements: null }))
  if (!resolveFeature(entitlements, FEATURES.RECEIVABLES)) return NextResponse.json({ error: 'La cartera no está habilitada en tu plan.' }, { status: 402 })
  const docs = await listReceivableDocuments(getAdminDb(adminUser.tenantId), { limit: 10000 })
  return new NextResponse(receivablesToCsv(docs), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cartera-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
