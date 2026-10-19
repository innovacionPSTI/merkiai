import { NextRequest, NextResponse } from 'next/server'
import { setCampaignStatus } from '@merkiai/database'
import type { CampaignStatus } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

const ALLOWED: CampaignStatus[] = ['scheduled', 'active', 'paused', 'cancelled', 'ended']

// HU-289 AC-2 · control manual del estado (pausar/reanudar/cancelar).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'ventas_vip')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const status = b.status as CampaignStatus
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  await setCampaignStatus(Number(id), status, getAdminDb(adminUser.tenantId))
  return NextResponse.json({ ok: true })
}
