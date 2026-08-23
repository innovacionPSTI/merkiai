import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, TuCompraGateway } from '@vps/database'
import { reconcileTuCompraOrder } from '@/lib/tucompra-reconcile'

/**
 * POST /api/checkout/tucompra/finalize-daviplata  { order: "ORD-XXXX", otp: "123456" }
 *
 * Daviplata (modalidad integrador): tras crear la transacción con CodigoRespuesta 2
 * (pendiente), el usuario recibe un OTP. Con ese OTP + el `codigoSeguimiento`
 * persistido se confirma el débito (`finalizaPagoDaviplata`). Luego se reconcilia
 * el pedido contra la API (fuente de verdad) para aplicar stock/emails.
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
    const { order, otp } = await req.json()
    if (!order || typeof order !== 'string') {
      return NextResponse.json({ error: 'Falta el número de pedido' }, { status: 400 })
    }
    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return NextResponse.json({ error: 'Ingresa el código OTP de Daviplata.' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: ord } = await supabase
      .from('orders')
      .select('payment_method, payment_status, tucompra_codigo_seguimiento')
      .eq('order_number', order)
      .single()

    if (!ord) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    if (ord.payment_method !== 'tucompra') {
      return NextResponse.json({ error: 'El pedido no es de Tu Compra' }, { status: 400 })
    }
    if (ord.payment_status === 'approved') {
      return NextResponse.json({ status: 'approved' })
    }
    if (!ord.tucompra_codigo_seguimiento) {
      return NextResponse.json({ error: 'No hay código de seguimiento para este pedido.' }, { status: 400 })
    }

    const config = await getPaymentConfig().catch(() => null)
    if (!config?.tucompra_user || !config.tucompra_password || !config.tucompra_terminal) {
      return NextResponse.json({ error: 'Tu Compra no está configurado.' }, { status: 503 })
    }

    const gateway = new TuCompraGateway({
      usuario: config.tucompra_user,
      clave: config.tucompra_password,
      terminal: config.tucompra_terminal,
      apiUrl: config.tucompra_api_url ?? undefined,
    })

    const result = await gateway.finalizarPagoDaviplata(ord.tucompra_codigo_seguimiento, otp.trim())
    if (result.codigoRespuesta === '1' || result.codigoRespuesta === '99') {
      return NextResponse.json(
        { error: result.descripcion ? `Daviplata: ${result.descripcion}` : 'El código OTP no es válido o el pago fue rechazado.' },
        { status: 400 },
      )
    }

    // Sincroniza contra la API (aplica stock + emails si quedó aprobado).
    const rec = await reconcileTuCompraOrder(order)
    return NextResponse.json({ status: rec.status ?? 'pending' })
  } catch (err) {
    console.error('[checkout/tucompra/finalize-daviplata]', err)
    return NextResponse.json({ error: 'No se pudo finalizar el pago con Daviplata.' }, { status: 502 })
  }
}
