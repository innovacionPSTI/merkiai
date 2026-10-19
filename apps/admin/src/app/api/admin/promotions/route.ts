import { NextRequest, NextResponse } from 'next/server'
import { listPromotions, createPromotion } from '@merkiai/database'
import type { PromotionType } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-147 · promociones. Gated por la sección "cupones" (marketing).
async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'cupones')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function GET() {
  const g = await guard()
  if ('error' in g) return g.error
  return NextResponse.json({ promotions: await listPromotions(g.db) })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const b = await req.json().catch(() => ({}))
  try {
    const promotion = await createPromotion({
      name: String(b.name ?? ''),
      type: b.type as PromotionType,
      config: b.config ?? {},
      combinable: !!b.combinable,
      priority: b.priority != null && b.priority !== '' ? Number(b.priority) : 100,
      starts_at: b.starts_at || null,
      ends_at: b.ends_at || null,
    }, g.db, g.adminUser.tenantId)
    return NextResponse.json({ promotion })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
