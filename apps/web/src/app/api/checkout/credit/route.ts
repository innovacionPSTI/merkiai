import { NextRequest, NextResponse } from 'next/server'
import { getGiftCardByCode, getStoreCreditBalance, isGiftCardRedeemable } from '@merkiai/database'
import { stackServerApp } from '@/stack'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

/**
 * HU-148 · previsualización de crédito en el checkout. Devuelve el saldo de una
 * gift card (si el código es válido) y el saldo a favor del cliente autenticado.
 * No modifica nada; el canje real ocurre en POST /api/checkout (server-side).
 */
// HU-300 · rate limit básico anti-enumeración de gift cards (por IP, en memoria).
const WINDOW_MS = 60_000
const MAX = 20
const hits = new Map<string, { count: number; resetAt: number }>()
function limited(ip: string): boolean {
  const now = Date.now()
  const e = hits.get(ip)
  if (!e || now > e.resetAt) { hits.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return false }
  e.count++
  return e.count > MAX
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (limited(ip)) return NextResponse.json({ giftCard: null, storeCredit: 0, error: 'Demasiados intentos.' }, { status: 429 })

    const { tenantId } = await resolveTenant()
    const db = getMachineDb(tenantId)
    const body = await req.json().catch(() => ({}))

    let giftCard: { balance: number } | null = null
    if (body.code) {
      const gc = await getGiftCardByCode(String(body.code), db)
      if (gc && isGiftCardRedeemable(gc)) giftCard = { balance: gc.balance }
    }

    let storeCredit = 0
    const user = await stackServerApp.getUser().catch(() => null)
    if (user?.id) {
      const { data: cust } = await db.from('customers').select('id').eq('stack_id', user.id).maybeSingle()
      if (cust?.id) storeCredit = await getStoreCreditBalance(cust.id as string, db)
    }

    return NextResponse.json({ giftCard, storeCredit })
  } catch {
    return NextResponse.json({ giftCard: null, storeCredit: 0 })
  }
}
