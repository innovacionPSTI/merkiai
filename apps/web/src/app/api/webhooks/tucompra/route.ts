import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig, TuCompraGateway, applyStockForOrder, markWebhookEventProcessed } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { amountCoversOrder } from '@/lib/payment-guards'
import { sendOrderConfirmation, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@merkiai/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * URL de Confirmación de Tu Compra (server-to-server).
 *
 * Se configura en el panel del comercio (Tu Compra → URL de Confirmación).
 * Tu Compra hace POST aquí con el resultado del pago. NO confiamos en el payload:
 * se extrae la referencia (order_number) y se re-consulta el estado autoritativo
 * a la API (`consultarEstadoTransaccion`). Idempotente.
 *
 * (La URL de Retorno es distinta: redirige el navegador del cliente a la página
 * de confirmación; esa NO confirma el pago.)
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // HU-216: config del TENANT resuelto por host (URLs de callback por subdominio).
  const { tenantId } = await resolveTenant()
  const paymentConfig = await getPaymentConfig(createServerClient(), tenantId).catch(() => null)
  if (!paymentConfig?.tucompra_user || !paymentConfig.tucompra_password || !paymentConfig.tucompra_terminal) {
    console.warn('[webhook/tucompra] Tu Compra no configurado')
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
  }

  const gateway = new TuCompraGateway({
    usuario:   paymentConfig.tucompra_user,
    clave:     paymentConfig.tucompra_password,
    terminal:  paymentConfig.tucompra_terminal,
    apiUrl:    paymentConfig.tucompra_api_url ?? undefined,
    publicKey: paymentConfig.tucompra_public_key ?? undefined,
    encryptionKey: paymentConfig.tucompra_encryption_key ?? undefined,
  })

  const webhookData = gateway.extractWebhookData(rawBody)
  if (!webhookData) return NextResponse.json({ ok: true })
  const orderReference = webhookData.orderReference

  // Verificación de firma (defensa en profundidad). Si la firma viene y NO coincide,
  // se rechaza. Si no hay llave/firma, `verify` devuelve null y seguimos: el estado
  // real lo confirma la re-consulta autenticada por API (fuente de verdad).
  const fields = ((): Record<string, string> => {
    const out: Record<string, string> = {}
    try {
      const s = rawBody.trim()
      if (s.startsWith('{')) {
        const j = JSON.parse(s) as Record<string, unknown>
        for (const k of Object.keys(j)) out[k.toLowerCase()] = String(j[k] ?? '')
      } else {
        new URLSearchParams(s).forEach((v, k) => { out[k.toLowerCase()] = v })
      }
    } catch { /* ignore */ }
    return out
  })()
  const firma = fields['firmatucompra']
  if (firma) {
    const valid = gateway.verifyConfirmationSignature({
      codigoFactura: fields['codigofactura'] ?? orderReference,
      valorFactura: fields['valorfactura'] ?? '',
      codigoAutorizacion: fields['codigoautorizacion'] ?? '',
      firmaTuCompra: firma,
    })
    if (valid === false) {
      console.warn(`[webhook/tucompra] Firma inválida para reference="${orderReference}"`)
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }
  }

  // codigoSeguimiento persistido (obligatorio para consultarEstadoTransaccion).
  const supabasePre = createServerClient()
  const { data: preOrder } = await supabasePre
    .from('orders')
    .select('tucompra_codigo_seguimiento, total')
    .eq('order_number', orderReference)
    .maybeSingle()

  // Estado autoritativo: re-consulta a la API (no se confía en el payload).
  const status = await gateway.queryStatusByReference(orderReference, preOrder?.tucompra_codigo_seguimiento ?? '')
  if (!status) {
    console.warn(`[webhook/tucompra] Sin estado para reference="${orderReference}"; se ignora`)
    return NextResponse.json({ ok: true, warning: 'no_status' })
  }
  let paymentStatus = status.status
  const paymentId = status.paymentId

  // Guarda anti-subpago: el monto pagado lo da la API (consultarEstadoTransaccion).
  if (paymentStatus === 'approved' && preOrder && !amountCoversOrder(status.amountCop, preOrder.total)) {
    console.warn(`[webhook/tucompra] SUBPAGO reference="${orderReference}" pagado=${status.amountCop} total=${preOrder.total}; se deja pendiente`)
    paymentStatus = 'pending'
  }

  // Idempotencia por id de evento (referencia + estado resuelto).
  const { duplicate } = await markWebhookEventProcessed('tucompra', `${orderReference}:${paymentStatus}`)
  if (duplicate) return NextResponse.json({ ok: true, idempotent: true })

  const supabase = createServerClient()
  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
    ...(paymentId ? { payment_id: paymentId } : {}),
    ...(paymentStatus === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', orderReference)
    .select()
    .maybeSingle()

  if (error) {
    console.error('[webhook/tucompra] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }
  if (!updatedOrder) {
    console.warn(`[webhook/tucompra] Sin orden para reference="${orderReference}"`)
    return NextResponse.json({ ok: true, warning: 'order_not_found' })
  }

  if (paymentStatus === 'approved') {
    await applyStockForOrder(orderReference)

    const storeConfig = await getStoreConfig(supabase, tenantId).catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? buildEmailConfig(storeConfig.resend_api_key, storeConfig.resend_from_email, storeConfig.store_name, storeConfig.email_provider)
      : null

    if (emailConfig) {
      try { await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig) }
      catch (err) { console.error('[webhook/tucompra] Error email confirmación:', err) }
    }

    const shipment = await createShipmentForOrder(orderReference)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase.from('orders').select('*').eq('order_number', orderReference).single()
      if (shippedOrder?.tracking_number) {
        try {
          const { sendShippingNotification } = await import('@/lib/email')
          await sendShippingNotification(shippedOrder as unknown as Order, emailConfig)
        } catch (err) { console.error('[webhook/tucompra] Error email envío:', err) }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
