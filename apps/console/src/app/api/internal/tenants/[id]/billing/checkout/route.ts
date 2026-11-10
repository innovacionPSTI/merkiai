/**
 * Inicia el pago del plan de un tenant (HU-440): crea/actualiza su suscripción y
 * devuelve el `formToken` de PayZen para el formulario embebido (registro de
 * tarjeta + primer cobro). Server-to-server: lo consume el admin del tenant.
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasInternalSecret } from '@/lib/auth'
import { platformDb } from '@/lib/platform-db'
import { makeBillingRepo, getBillingProvider } from '@/lib/billing-runtime'
import { startCheckout } from '@/lib/billing'

export const dynamic = 'force-dynamic'

const CLIENT_ERRORS = new Set(['tenant_not_found', 'owner_email_missing', 'plan_not_found', 'plan_is_free'])

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const interval = body?.interval === 'yearly' ? 'yearly' : 'monthly'
  try {
    const out = await startCheckout({ repo: makeBillingRepo(platformDb()), provider: getBillingProvider() }, { tenantId: id, interval })
    return NextResponse.json({ ...out, publicKey: process.env.PAYZEN_PUBLIC_KEY ?? null })
  } catch (err) {
    const msg = String((err as Error)?.message ?? err)
    if (CLIENT_ERRORS.has(msg)) return NextResponse.json({ error: msg }, { status: msg === 'tenant_not_found' ? 404 : 422 })
    return NextResponse.json({ error: 'checkout_failed', detail: msg }, { status: 502 })
  }
}
