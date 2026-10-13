import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServerClient, resolveEmailConfig, resolveShippingCreds, markWebhookEventProcessed } from '@merkiai/database'
import { getMachineDb } from '@/lib/machine-db'
import { sendShippingNotification, buildEmailConfig } from '@/lib/email'
import type { Order } from '@merkiai/database'

/**
 * Webhook de Skydropx — sección "Envíos" (eventos de paquetes / tracking).
 *
 * Payload (JSON:API, tipo "packages"):
 *   data.id                               → id del paquete (no lo guardamos)
 *   data.attributes.status                → estado de tracking (delivered, in_transit, …)
 *   data.attributes.tracking_number       → número de rastreo
 *   data.relationships.shipment.data.id   → id del envío  = orders.skydropx_shipment_id
 *   data.relationships.order.data.id      → id de orden Skydropx (solo plataformas)
 *
 * Autenticación (Skydropx → Webhooks, header "Authorization"):
 *   HMAC   (recomendado): "Authorization: HMAC <firma>",
 *          firma = HMAC-SHA512(secreto, raw_body) en hex minúsculas (RFC 6234).
 *   Bearer (alternativa): "Authorization: Bearer <token>" con token estático.
 * Si el tenant tiene secreto o token configurado, se exige y verifica
 * (fail-closed). Sin credencial configurada, se procesa (compatibilidad inicial).
 */

/** Estados de Skydropx → estado interno de la orden. */
const STATUS_MAP: Record<string, 'shipped' | 'delivered' | 'exception'> = {
  // Tracking oficial (enum doc legacy)
  created: 'shipped', picked_up: 'shipped', in_transit: 'shipped',
  last_mile: 'shipped', delivery_attempt: 'shipped', delivered_to_branch: 'shipped',
  delivered: 'delivered',
  exception: 'exception', in_return: 'exception', canceled: 'exception',
  destroyed: 'exception', retained: 'exception',
  // Variantes de envío
  label_created: 'shipped', label_printed: 'shipped', out_for_delivery: 'shipped',
  returned: 'exception', cancelled: 'exception',
  // Órdenes (por si se suscribe esa sección)
  sent: 'shipped', partially_sent: 'shipped', fulfilled: 'delivered',
  // draft / verified / pending → se ignoran
}

function safeEq(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf-8')
  const b = Buffer.from(received, 'utf-8')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

/** Verifica el header Authorization según el esquema (HMAC o Bearer). */
function authOk(authHeader: string | null, rawBody: string, secret?: string, token?: string): boolean {
  if (!authHeader) return false
  const m = authHeader.match(/^(\w+)\s+(.+)$/)
  if (!m) return false
  const scheme = m[1].toLowerCase()
  const value = m[2].trim()
  if (scheme === 'hmac' && secret) {
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
    return safeEq(expected, value.toLowerCase())
  }
  if (scheme === 'bearer' && token) {
    return safeEq(token, value)
  }
  return false
}

export async function POST(req: NextRequest) {
  let rawBody: string
  try { rawBody = await req.text() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  let payload: {
    data?: {
      id?: string
      type?: string
      attributes?: { status?: string; tracking_status?: string; tracking_number?: string }
      relationships?: { shipment?: { data?: { id?: string } }; order?: { data?: { id?: string } } }
    }
  }
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const attrs = payload.data?.attributes ?? {}
  const packageId = payload.data?.id ?? ''
  const shipmentId = payload.data?.relationships?.shipment?.data?.id ?? ''
  const trackingNumber = attrs.tracking_number ?? ''
  const rawStatus = (attrs.status ?? attrs.tracking_status ?? '').toLowerCase()
  const newStatus = STATUS_MAP[rawStatus] ?? null

  if (!newStatus || (!shipmentId && !trackingNumber)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Bootstrap: identificar el pedido (y su tenant) por id de envío o tracking.
  const supabase = createServerClient()
  const readCol = shipmentId ? 'skydropx_shipment_id' : 'tracking_number'
  const readVal = shipmentId || trackingNumber
  const { data: order0 } = await supabase.from('orders').select('tenant_id').eq(readCol, readVal).maybeSingle()
  if (!order0?.tenant_id) return NextResponse.json({ ok: true, warning: 'order_not_found' })
  const tenantId = order0.tenant_id as string

  // Autenticación: si la instancia del tenant tiene secreto/token, se exige.
  const creds = await resolveShippingCreds(getMachineDb(tenantId), tenantId).catch(() => null)
  const secret = creds?.webhookSecret
  const token = creds?.webhookToken
  if ((secret || token) && !authOk(req.headers.get('authorization'), rawBody, secret, token)) {
    console.warn('[webhook/skydropx] Autenticación inválida')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Idempotencia por id de paquete (unidad granular del evento) + estado.
  const eventId = packageId || shipmentId || trackingNumber
  const { duplicate } = await markWebhookEventProcessed('skydropx', `${eventId}:${newStatus}`)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq(readCol, readVal)
    .select()
    .single()
  if (error) {
    console.error('[webhook/skydropx] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  if (newStatus === 'shipped' && updatedOrder?.tracking_number) {
    try {
      const ec = await resolveEmailConfig(getMachineDb(updatedOrder.tenant_id), updatedOrder.tenant_id).catch(() => null)
      if (ec) {
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
