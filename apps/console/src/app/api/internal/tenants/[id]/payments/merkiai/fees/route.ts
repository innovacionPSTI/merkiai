/**
 * Registra la comisión de Merkiai Pagos de una venta aprobada (HU-441).
 * La llama el webhook del storefront ANTES de cambiar el pedido; idempotente por
 * (tenant, paymentId). Si falla, el webhook responde 5xx y PayZen reintenta.
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { recordPaymentFee } from '@/lib/merkiai-pagos'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const b = await req.json().catch(() => null) as { paymentId?: string; orderNumber?: string; amountCents?: number; currency?: string } | null
  if (!b?.paymentId || !b.orderNumber || !(typeof b.amountCents === 'number' && b.amountCents >= 0)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  try {
    const r = await recordPaymentFee(platformDb(), { tenantId: id, paymentId: b.paymentId, orderNumber: b.orderNumber, amountCents: Math.round(b.amountCents), currency: b.currency ?? 'COP' })
    return NextResponse.json(r)
  } catch (err) {
    return NextResponse.json({ error: 'fee_failed', detail: String((err as Error)?.message ?? err) }, { status: 502 })
  }
}
