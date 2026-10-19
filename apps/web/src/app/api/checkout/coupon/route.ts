/**
 * POST /api/checkout/coupon
 * Valida un código de cupón y retorna el descuento calculado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCouponByCode, validateCoupon } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

// HU-300 · rate limit básico anti-enumeración (por IP, en memoria por instancia).
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
// Mensaje NEUTRO: no distingue "no existe" de "sin saldo/caducado" (evita enumeración).
const NEUTRAL = 'El cupón no es válido o no aplica a tu compra.'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (limited(ip)) return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })

    const { code, subtotal } = await req.json()

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ error: 'Se requiere code y subtotal' }, { status: 400 })
    }

    // Tenant-scoped: el cupón pertenece al tenant resuelto por Host (no cross-tenant).
    const { tenantId } = await resolveTenant()
    const coupon = await getCouponByCode(code.trim(), getMachineDb(tenantId))
    if (!coupon) {
      return NextResponse.json({ error: NEUTRAL }, { status: 422 })
    }

    const result = validateCoupon(coupon, subtotal)
    if (!result.valid) {
      return NextResponse.json({ error: NEUTRAL }, { status: 422 })
    }

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: result.discount,
    })
  } catch (err) {
    console.error('[api/checkout/coupon]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
