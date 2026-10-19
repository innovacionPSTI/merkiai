import { NextRequest, NextResponse } from 'next/server'
import { listSegments, createSegment } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-288 · Segmentos de clientes. Gated por la sección "ventas_vip".
async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'ventas_vip')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function GET() {
  const g = await guard()
  if ('error' in g) return g.error
  return NextResponse.json({ segments: await listSegments(g.db) })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const body = await req.json().catch(() => ({}))
  try {
    const segment = await createSegment(
      { name: String(body.name ?? ''), type: body.type === 'rules' ? 'rules' : 'manual', rules: body.rules ?? {} },
      g.db, g.adminUser.tenantId,
    )
    return NextResponse.json({ segment })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
