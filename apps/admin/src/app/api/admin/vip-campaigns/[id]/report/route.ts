import { NextRequest, NextResponse } from 'next/server'
import { getVipCampaignReport } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-294 · reporte de una campaña VIP (participación + ventas de los miembros).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'ventas_vip')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  try {
    const report = await getVipCampaignReport(Number(id), getAdminDb(adminUser.tenantId))
    return NextResponse.json({ report })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
