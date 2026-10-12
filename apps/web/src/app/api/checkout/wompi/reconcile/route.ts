import { NextRequest, NextResponse } from 'next/server'
import { reconcileWompiOrder } from '@merkiai/database'

/**
 * POST /api/checkout/wompi/reconcile  { order: "VPS-XXXX", id?: "<txn>" }
 *
 * Reconciliación best-effort de un pago Wompi pendiente desde la confirmación.
 * El estado proviene de la API autenticada de Wompi (re-consulta por id de
 * transacción, el que llega en el redirect `?id=`); nunca se acepta el estado
 * desde el cliente. Rate-limited por IP.
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
    const { order, id } = await req.json()
    if (!order || typeof order !== 'string') {
      return NextResponse.json({ error: 'Falta el número de pedido' }, { status: 400 })
    }
    const txnId = typeof id === 'string' && id ? id : null
    const result = await reconcileWompiOrder(order, txnId)
    return NextResponse.json({ status: result.status ?? 'pending' })
  } catch (err) {
    console.error('[checkout/wompi/reconcile]', err)
    return NextResponse.json({ status: 'pending' })
  }
}
