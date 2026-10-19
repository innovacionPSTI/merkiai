import { NextRequest, NextResponse } from 'next/server'
import { notifyCampaignMembers, resolveEmailConfig } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-292 · avisa por correo a los miembros del segmento de la campaña (idempotente).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'ventas_vip')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const db = getAdminDb(adminUser.tenantId)
  const ec = await resolveEmailConfig(db, adminUser.tenantId).catch(() => null)
  if (!ec?.apiKey || !ec?.fromEmail) {
    return NextResponse.json({ error: 'Configura el correo (Configuración → Emails) antes de enviar avisos.' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const accessUrl: string | null = typeof body.accessUrl === 'string' ? body.accessUrl : null

  try {
    const result = await notifyCampaignMembers(
      Number(id),
      {
        emailConfig: { apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName, emailProvider: ec.provider },
        accessUrl,
      },
      db,
      adminUser.tenantId,
    )
    return NextResponse.json({ result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
