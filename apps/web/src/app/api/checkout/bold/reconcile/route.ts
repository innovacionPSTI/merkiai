import { NextRequest, NextResponse } from 'next/server'
import { reconcileBoldOrder } from '@/lib/bold-reconcile'

/**
 * POST /api/checkout/bold/reconcile  { order: "VPS-XXXX" }
 *
 * Endpoint público (best-effort) para reconciliar un pago Bold pendiente desde
 * la página de confirmación. El estado proviene de la API autenticada de Bold;
 * nunca se acepta el estado desde el cliente. Rate-limited por IP porque el
 * servicio de fallback de Bold debe usarse con moderación.
 */

// ── Rate limiting (best-effort, por instancia) ──────────────────────────────
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

    const result = await reconcileBoldOrder(order)
    // Nunca exponemos detalles internos; solo el estado resultante.
    return NextResponse.json({ status: result.status ?? 'pending' })
  } catch (err) {
    console.error('[checkout/bold/reconcile]', err)
    return NextResponse.json({ status: 'pending' })
  }
}
