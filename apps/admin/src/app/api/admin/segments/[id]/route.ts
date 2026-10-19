import { NextRequest, NextResponse } from 'next/server'
import { updateSegment, deleteSegment } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'ventas_vip')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard()
  if ('error' in g) return g.error
  const body = await req.json().catch(() => ({}))
  try {
    await updateSegment(Number(id), { name: body.name, rules: body.rules }, g.db)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard()
  if ('error' in g) return g.error
  await deleteSegment(Number(id), g.db)
  return NextResponse.json({ ok: true })
}
