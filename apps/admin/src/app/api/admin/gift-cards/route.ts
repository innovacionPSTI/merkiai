import { NextRequest, NextResponse } from 'next/server'
import { listGiftCards, issueGiftCard, logAudit } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { userCanAccess } from '@/lib/roles'

// HU-148 · gift cards. Gated por la sección "cupones".
async function guard() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!userCanAccess(adminUser, 'cupones')) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { adminUser, db: getAdminDb(adminUser.tenantId) }
}

export async function GET() {
  const g = await guard()
  if ('error' in g) return g.error
  return NextResponse.json({ giftCards: await listGiftCards(g.db) })
}

export async function POST(req: NextRequest) {
  const g = await guard()
  if ('error' in g) return g.error
  const b = await req.json().catch(() => ({}))
  try {
    const giftCard = await issueGiftCard(
      { amount: Number(b.amount), note: b.note || null, expires_at: b.expires_at || null },
      g.db, g.adminUser.tenantId,
    )
    // HU-300 · auditoría de emisión de gift cards.
    await logAudit(g.db, {
      tenantId: g.adminUser.tenantId, actorEmail: g.adminUser.email, actorRole: g.adminUser.role,
      action: 'giftcard.issue', entity: 'gift_card', entityId: giftCard.id,
      summary: `Emitió gift card ${giftCard.code} por ${giftCard.initial_balance}`,
      metadata: { amount: giftCard.initial_balance },
    })
    return NextResponse.json({ giftCard })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 })
  }
}
