import { NextRequest, NextResponse } from 'next/server'
import { listRedirects, createRedirect } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-113 · Gestor de redirects 301. Gated por la sección "configuracion".
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'configuracion')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const db = getAdminDb(adminUser.tenantId)
  return NextResponse.json({ redirects: await listRedirects(db) })
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'configuracion')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const db = getAdminDb(adminUser.tenantId)
  try {
    const redirect = await createRedirect(
      { from_path: String(body.from_path ?? ''), to_path: String(body.to_path ?? ''), status_code: Number(body.status_code) || 301, note: body.note || null },
      db,
      adminUser.tenantId,
    )
    return NextResponse.json({ redirect })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al crear la regla' }, { status: 400 })
  }
}
