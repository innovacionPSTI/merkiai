import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'

/**
 * GET /api/checkout/status?order=ORD-XXXX
 *
 * Devuelve el estado de pago de un pedido para que la página de confirmación
 * refleje el resultado real (aprobado/pendiente/rechazado). Solo expone el estado
 * y el método — nunca datos del cliente. Público (el número de pedido no es secreto).
 * Rate-limited por IP para desincentivar la enumeración de estados de pedidos.
 */
const WINDOW_MS = 60_000
const MAX_REQUESTS = 30
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

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const order = req.nextUrl.searchParams.get('order')
  if (!order) return NextResponse.json({ error: 'Falta el número de pedido' }, { status: 400 })

  try {
    // Aislamiento: order_number es único POR tenant (e17/03). Sin acotar por el
    // tenant del host, cualquiera podría leer el estado de un pedido de otra
    // tienda conociendo su número. Resolvemos el tenant por host y filtramos.
    const { tenantId } = await resolveTenant()
    const supabase = createServerClient()
    const { data } = await supabase
      .from('orders')
      .select('order_number, payment_status, payment_method')
      .eq('order_number', order)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!data) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    return NextResponse.json({
      order_number: data.order_number,
      payment_status: data.payment_status,
      payment_method: data.payment_method,
    })
  } catch (err) {
    console.error('[checkout/status]', err)
    return NextResponse.json({ error: 'Error consultando el pedido' }, { status: 500 })
  }
}
