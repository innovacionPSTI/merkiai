import { NextRequest, NextResponse } from 'next/server'
import { setGiftCardActive } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'cupones')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  await setGiftCardActive(Number(id), !!b.active, getAdminDb(adminUser.tenantId))
  return NextResponse.json({ ok: true })
}
