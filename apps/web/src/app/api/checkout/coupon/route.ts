/**
 * POST /api/checkout/coupon
 * Valida un código de cupón y retorna el descuento calculado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCouponByCode, validateCoupon, checkRateLimit, reportError } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

// Mensaje NEUTRO: no distingue "no existe" de "sin saldo/caducado" (evita enumeración).
const NEUTRAL = 'El cupón no es válido o no aplica a tu compra.'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    // Tenant-scoped: el cupón pertenece al tenant resuelto por Host (no cross-tenant).
    const { tenantId } = await resolveTenant()
    const db = getMachineDb(tenantId)

    // HU-300 · rate-limit DISTRIBUIDO anti-enumeración + bloqueo (cooldown) + alerta.
    const rl = await checkRateLimit(db, { tenantId, bucket: 'checkout.coupon', ident: ip, windowSecs: 60, max: 20, lockSecs: 300 })
    if (rl.justLocked) reportError(new Error('rate-limit lock'), { scope: 'abuse.checkout.coupon', tenantId, extra: { ip, count: rl.count } })
    if (!rl.allowed) return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })

    const { code, subtotal } = await req.json()

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ error: 'Se requiere code y subtotal' }, { status: 400 })
    }

    const coupon = await getCouponByCode(code.trim(), db)
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
