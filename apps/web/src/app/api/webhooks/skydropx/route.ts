import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServerClient, resolveEmailConfig, resolveShippingCreds, markWebhookEventProcessed } from '@merkiai/database'
import { getMachineDb } from '@/lib/machine-db'
import { sendShippingNotification, buildEmailConfig } from '@/lib/email'
import type { Order } from '@merkiai/database'

/**
 * Webhook de Skydropx PRO — eventos de seguimiento y entrega.
 *   shipment.status.updated / package.tracking.updated → actualiza order.status
 *   *.delivered → entregado · *.exception/returned → excepción
 *
 * Seguridad (HU-278):
 *  - El pedido se identifica por `tracking_number` (global del carrier) → se lee
 *    primero para conocer el tenant (único borde service-role legítimo).
 *  - Firma: si la instancia de Skydropx del tenant tiene `webhook_secret`
 *    configurado, se exige HMAC-SHA512(payload, secret) en X-Skydropx-Signature
 *    (fail-closed). Sin secreto configurado, se procesa (compatibilidad).
 *  - Idempotencia por id de evento + estado.
 */

const WORKFLOW_STATUS_MAP: Record<string, 'shipped' | 'delivered' | 'exception'> = {
  label_printed: 'shipped', in_transit: 'shipped', out_for_delivery: 'shipped',
  delivered: 'delivered', exception: 'exception', returned: 'exception', failed_attempt: 'shipped',
}
const EVENT_STATUS_MAP: Record<string, 'shipped' | 'delivered' | 'exception'> = {
  'shipment.status.updated': 'shipped', 'shipment.delivered': 'delivered', 'shipment.exception': 'exception',
  'package.tracking.updated': 'shipped', 'package.in_transit': 'shipped', 'package.out_for_delivery': 'shipped',
  'package.delivered': 'delivered', 'package.returned': 'exception',
}

function signatureOk(expectedHex: string, received: string): boolean {
  if (!received) return false
  const a = Buffer.from(expectedHex, 'utf-8')
  const b = Buffer.from(received, 'utf-8')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

export async function POST(req: NextRequest) {
  let rawBody: string
  try { rawBody = await req.text() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  let payload: {
    event?: string
    data?: { id?: string; type?: string; attributes?: { workflow_status?: string; tracking_number?: string; status_detail?: string; delivered_at?: string } }
  }
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const event = payload.event ?? ''
  const attrs = payload.data?.attributes ?? {}
  const trackingNumber = attrs.tracking_number ?? ''

  let newStatus: 'shipped' | 'delivered' | 'exception' | null = null
  if (attrs.workflow_status && WORKFLOW_STATUS_MAP[attrs.workflow_status]) newStatus = WORKFLOW_STATUS_MAP[attrs.workflow_status]
  else if (EVENT_STATUS_MAP[event]) newStatus = EVENT_STATUS_MAP[event]

  if (!newStatus || !trackingNumber) return NextResponse.json({ ok: true, skipped: true })

  // Bootstrap: identificar el pedido (y su tenant) por tracking_number.
  const supabase = createServerClient()
  const { data: order0 } = await supabase
    .from('orders').select('tenant_id').eq('tracking_number', trackingNumber).maybeSingle()
  if (!order0?.tenant_id) return NextResponse.json({ ok: true, warning: 'order_not_found' })
  const tenantId = order0.tenant_id as string

  // Firma: si la instancia del tenant tiene secreto, se exige (fail-closed).
  const creds = await resolveShippingCreds(getMachineDb(tenantId), tenantId).catch(() => null)
  const secret = creds?.webhookSecret
  if (secret) {
    const sig = req.headers.get('x-skydropx-signature') ?? ''
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
    if (!signatureOk(expected, sig)) {
      console.warn('[webhook/skydropx] Firma inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  // Idempotencia por id de evento + estado.
  const eventId = payload.data?.id ?? trackingNumber
  const { duplicate } = await markWebhookEventProcessed('skydropx', `${eventId}:${newStatus}`)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('tracking_number', trackingNumber)
    .select()
    .single()
  if (error) {
    console.error('[webhook/skydropx] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  if (newStatus === 'shipped' && updatedOrder) {
    try {
      const ec = await resolveEmailConfig(getMachineDb(updatedOrder.tenant_id), updatedOrder.tenant_id).catch(() => null)
      if (ec && updatedOrder.tracking_number) {
        await sendShippingNotification(
          updatedOrder as unknown as Order & { tracking_number: string; carrier_name: string | null; label_url: string | null },
          buildEmailConfig(ec.apiKey, ec.fromEmail, ec.storeName, ec.provider),
        )
      }
    } catch (emailErr) {
      console.error('[webhook/skydropx] Error enviando email de tracking:', emailErr)
    }
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
