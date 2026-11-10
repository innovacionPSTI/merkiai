/**
 * Resumen de facturación de un tenant (HU-440): plan, estado de la suscripción,
 * próximo cobro y últimos eventos. Sin secretos. Server-to-server (admin del tenant).
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { makeBillingRepo } from '@/lib/billing-runtime'
import { getBillingSummary } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const summary = await getBillingSummary(makeBillingRepo(platformDb()), id)
    if (!summary) return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 })
    return NextResponse.json({ ...summary, billingEnabled: Boolean(process.env.PAYZEN_SHOP_ID && process.env.PAYZEN_PASSWORD) })
  } catch (err) {
    return NextResponse.json({ error: 'summary_failed', detail: String((err as Error)?.message ?? err) }, { status: 502 })
  }
}
