import { NextRequest, NextResponse } from 'next/server'
import { reconcileTuCompraOrder } from '@/lib/tucompra-reconcile'

/**
 * POST /api/checkout/tucompra/reconcile  { order: "ORD-XXXX" }
 *
 * Tu Compra no tiene webhook (su API REST es pull): este endpoint reconcilia un
 * pago pendiente desde la página de confirmación consultando el estado real a la
 * API autenticada de Tu Compra. Nunca se acepta el estado desde el cliente.
 * Rate-limited por IP.
 */

const WINDOW_MS = 60_000
const MAX_REQUESTS = 6
type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_REQUESTS
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  try {
    const { order } = await req.json()
    if (!order || typeof order !== 'string') {
      return NextResponse.json({ error: 'Falta el número de pedido' }, { status: 400 })
    }
    const result = await reconcileTuCompraOrder(order)
    return NextResponse.json({ status: result.status ?? 'pending' })
  } catch (err) {
    console.error('[checkout/tucompra/reconcile]', err)
    return NextResponse.json({ status: 'pending' })
  }
}
