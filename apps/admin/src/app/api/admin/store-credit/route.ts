import { NextRequest, NextResponse } from 'next/server'
import { getStoreCreditBalance, addStoreCredit, logAudit } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-148 · saldo a favor por cliente (buscar por email). Gated por "cupones".
async function resolve(email: string, db: ReturnType<typeof getAdminDb>) {
  const { data } = await db.from('customers').select('id, name, email').eq('email', email.trim().toLowerCase()).maybeSingle()
  return data as { id: string; name: string | null; email: string } | null
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'cupones')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const email = new URL(req.url).searchParams.get('email') ?? ''
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  const db = getAdminDb(adminUser.tenantId)
  const customer = await resolve(email, db)
  if (!customer) return NextResponse.json({ error: 'No hay un cliente con ese email.' }, { status: 404 })
  const balance = await getStoreCreditBalance(customer.id, db)
  return NextResponse.json({ customer, balance })
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!userCanAccess(adminUser, 'cupones')) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  const email = String(b.email ?? '')
  const delta = Math.round(Number(b.delta))
  if (!email || !Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: 'Email y monto (≠ 0) requeridos.' }, { status: 400 })
  }
  const db = getAdminDb(adminUser.tenantId)
  const customer = await resolve(email, db)
  if (!customer) return NextResponse.json({ error: 'No hay un cliente con ese email.' }, { status: 404 })
  const current = await getStoreCreditBalance(customer.id, db)
  if (current + delta < 0) return NextResponse.json({ error: `El saldo no puede quedar negativo (actual: ${current}).` }, { status: 400 })
  await addStoreCredit({ customerId: customer.id, delta, reason: b.reason || 'manual' }, db, adminUser.tenantId)
  // HU-300 · auditoría de ajuste manual de saldo a favor.
  await logAudit(db, {
    tenantId: adminUser.tenantId, actorEmail: adminUser.email, actorRole: adminUser.role,
    action: 'storecredit.adjust', entity: 'customer', entityId: customer.id,
    summary: `Ajustó saldo de ${customer.email} en ${delta} (nuevo: ${current + delta})`,
    metadata: { delta, balance: current + delta, reason: b.reason || 'manual' },
  })
  return NextResponse.json({ customer, balance: current + delta })
}
