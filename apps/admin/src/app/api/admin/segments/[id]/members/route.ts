import { NextRequest, NextResponse } from 'next/server'
import { listSegmentMembers, addSegmentMembers, removeSegmentMember } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'ventas_vip')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard()
  if ('error' in g) return g.error
  return NextResponse.json({ members: await listSegmentMembers(Number(id), g.db) })
}

// Agrega un cliente manualmente por email (AC-1 de HU-288).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard()
  if ('error' in g) return g.error
  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  const { data: customer } = await g.db.from('customers').select('id').eq('email', email).maybeSingle()
  if (!customer?.id) return NextResponse.json({ error: 'No hay un cliente con ese email en tu tienda.' }, { status: 404 })
  await addSegmentMembers(Number(id), [customer.id as string], g.db, g.adminUser.tenantId)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard()
  if ('error' in g) return g.error
  const customerId = new URL(req.url).searchParams.get('customer_id')
  if (!customerId) return NextResponse.json({ error: 'customer_id requerido' }, { status: 400 })
  await removeSegmentMember(Number(id), customerId, g.db)
  return NextResponse.json({ ok: true })
}
