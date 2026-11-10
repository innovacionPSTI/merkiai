/**
 * IPN de PayZen (HU-440). Endpoint PÚBLICO (lo llama PayZen, sin sesión): la
 * autenticidad la da la firma HMAC `kr-hash`, verificada en `parseWebhook`.
 * Idempotente por (provider, event_key). 5xx → PayZen reintenta.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getBillingDeps } from '@/lib/billing-runtime'
import { processBillingWebhook } from '@/lib/billing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let fields: Record<string, string>
  try {
    const form = await req.formData()
    fields = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]))
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  try {
    const result = await processBillingWebhook(getBillingDeps(), fields)
    return NextResponse.json(result)
  } catch (err) {
    const msg = String((err as Error)?.message ?? err)
    if (/firma de IPN inválida/.test(msg)) return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
    console.error('[billing] IPN falló', msg)
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 })
  }
}
