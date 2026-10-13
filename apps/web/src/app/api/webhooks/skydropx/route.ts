import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServerClient, resolveEmailConfig, resolveShippingCreds, markWebhookEventProcessed } from '@merkiai/database'
import { getMachineDb } from '@/lib/machine-db'
import { sendShippingNotification, buildEmailConfig } from '@/lib/email'
import type { Order } from '@merkiai/database'

/**
 * Webhook de Skydropx — sección "Envíos" (shipments).
 *
 * Nuestra integración crea envíos vía POST /api/v1/shipments y guarda
 * skydropx_shipment_id + tracking_number en la orden. Este webhook notifica el
 * avance del envío (en tránsito / entregado / excepción) para actualizar
 * order.status y enviar el correo de seguimiento.
 *
 * Formato (JSON:API):
 *   { data: { id, type, attributes: { status, tracking_number?, ... } } }
 *   `data.id` = id del envío (= orders.skydropx_shipment_id).
 *
 * Seguridad (HU-278):
 *  - Autenticación por TOKEN: en Skydropx → Webhooks, método "Token"; se envía
 *    como `Authorization: Bearer <token>`. Si la instancia del tenant tiene
 *    `webhook_token`, se exige y compara en tiempo constante (fail-closed).
 *    Sin token configurado, se procesa (compatibilidad inicial).
 *  - Idempotencia por id de envío + estado.
 */

/** Estados de Skydropx → estado interno de la orden. Cubre envíos y órdenes. */
const STATUS_MAP: Record<string, 'shipped' | 'delivered' | 'exception'> = {
  // Tracking oficial (GET /shipments/tracking · enum de la doc legacy)
  created: 'shipped', picked_up: 'shipped', in_transit: 'shipped',
  last_mile: 'shipped', delivery_attempt: 'shipped', delivered_to_branch: 'shipped',
  delivered: 'delivered',
  exception: 'exception', in_return: 'exception', canceled: 'exception',
  destroyed: 'exception', retained: 'exception',
  // Variantes de envío que también aparecen en algunos eventos
  label_created: 'shipped', label_printed: 'shipped', out_for_delivery: 'shipped',
  returned: 'exception', cancelled: 'exception',
  // Órdenes (por si se suscribe esa sección)
  sent: 'shipped', partially_sent: 'shipped', fulfilled: 'delivered',
  // draft / verified / pending → se ignoran (no cambian el estado de la orden)
}

function bearerOk(expected: string, authHeader: string | null): boolean {
  if (!authHeader) return false
  const received = authHeader.replace(/^Bearer\s+/i, '').trim()
  const a = Buffer.from(expected, 'utf-8')
  const b = Buffer.from(received, 'utf-8')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

export async function POST(req: NextRequest) {
  let rawBody: string
  try { rawBody = await req.text() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  let payload: {
    event?: string
    data?: { id?: string; type?: string; attributes?: { status?: string; tracking_status?: string; workflow_status?: string; tracking_number?: string } }
  }
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const attrs = payload.data?.attributes ?? {}
  const shipmentId = payload.data?.id ?? ''
  const trackingNumber = attrs.tracking_number ?? ''
  // El estado de tracking es el más específico; se aceptan variantes por robustez.
  const rawStatus = (attrs.tracking_status ?? attrs.status ?? attrs.workflow_status ?? payload.event ?? '').toLowerCase()
  const newStatus = STATUS_MAP[rawStatus] ?? null

  if (!newStatus || (!shipmentId && !trackingNumber)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Bootstrap: identificar el pedido (y su tenant) por id de envío o tracking.
  const supabase = createServerClient()
  let q = supabase.from('orders').select('tenant_id')
  q = shipmentId ? q.eq('skydropx_shipment_id', shipmentId) : q.eq('tracking_number', trackingNumber)
  const { data: order0 } = await q.maybeSingle()
  if (!order0?.tenant_id) return NextResponse.json({ ok: true, warning: 'order_not_found' })
  const tenantId = order0.tenant_id as string

  // Autenticación por token: si la instancia del tenant lo tiene, se exige.
  const creds = await resolveShippingCreds(getMachineDb(tenantId), tenantId).catch(() => null)
  const token = creds?.webhookToken
  if (token && !bearerOk(token, req.headers.get('authorization'))) {
    console.warn('[webhook/skydropx] Token inválido')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Idempotencia por id de envío + estado.
  const eventId = shipmentId || trackingNumber
  const { duplicate } = await markWebhookEventProcessed('skydropx', `${eventId}:${newStatus}`)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  const match = supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() })
  const { data: updatedOrder, error } = await (
    shipmentId ? match.eq('skydropx_shipment_id', shipmentId) : match.eq('tracking_number', trackingNumber)
  ).select().single()
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
