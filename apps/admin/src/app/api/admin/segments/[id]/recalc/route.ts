import { NextRequest, NextResponse } from 'next/server'
import { recalcSegment } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-288 AC-3 · recalcula los miembros de un segmento por reglas (idempotente).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'ventas_vip')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  try {
    const count = await recalcSegment(Number(id), getAdminDb(adminUser.tenantId), adminUser.tenantId)
    return NextResponse.json({ count })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
