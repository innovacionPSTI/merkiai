import { NextRequest, NextResponse } from 'next/server'
import { listCampaigns, createCampaign } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'ventas_vip')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function GET() {
  const g = await guard()
  if ('error' in g) return g.error
  return NextResponse.json({ campaigns: await listCampaigns(g.db) })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const b = await req.json().catch(() => ({}))
  try {
    const campaign = await createCampaign({
      name: String(b.name ?? ''), segment_id: b.segment_id ? Number(b.segment_id) : null,
      starts_at: String(b.starts_at ?? ''), ends_at: String(b.ends_at ?? ''),
      offer_percent: b.offer_percent != null && b.offer_percent !== '' ? Number(b.offer_percent) : null,
      quota: b.quota != null && b.quota !== '' ? Number(b.quota) : null,
      product_ids: Array.isArray(b.product_ids) ? b.product_ids.map(Number) : [],
      category_ids: Array.isArray(b.category_ids) ? b.category_ids.map(Number) : [],
    }, g.db, g.adminUser.tenantId)
    return NextResponse.json({ campaign })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
