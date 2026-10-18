import { NextRequest, NextResponse } from 'next/server'
import { setRedirectActive, deleteRedirect } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-113 · activar/desactivar o eliminar una regla de redirect.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'configuracion')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const db = getAdminDb(adminUser.tenantId)
  try {
    await setRedirectActive(Number(id), !!body.active, db)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'configuracion')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const db = getAdminDb(adminUser.tenantId)
  try {
    await deleteRedirect(Number(id), db)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
