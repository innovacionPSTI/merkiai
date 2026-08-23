/**
 * BoldGateway — integración con Bold (pasarela colombiana).
 * Documentación: https://developers.bold.co/pagos-en-linea/api-integration
 *                https://developers.bold.co/webhook
 *
 * Flujo (API "Link de pagos"):
 *   1. POST /online/link/v1 con `Authorization: x-api-key <api_key>` → devuelve payload.url
 *   2. Se redirige al cliente a payload.url (checkout.bold.co/LNK_…)
 *   3. Bold notifica el resultado por webhook (firmado con HMAC-SHA256)
 *
 * Correlación del pedido: se envía `metadata.reference = order_number` al crear el
 * link; el webhook lo devuelve en `data.metadata.reference`.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import type { PaymentGateway, CreatePaymentParams, PaymentStatus, WebhookPaymentData } from './types'

export interface BoldConfig {
  /** Llave de identidad (API key) para crear links: header Authorization: x-api-key <key> */
  apiKey: string
  /** Llave secreta para verificar la firma del webhook (vacía en sandbox) */
  secretKey: string
  /** En sandbox la verificación de firma usa llave secreta vacía */
  sandbox?: boolean
}

const BASE_URL = 'https://integrations.api.bold.co'

export class BoldGateway implements PaymentGateway {
  readonly name = 'bold'

  constructor(private readonly cfg: BoldConfig) {}

  /**
   * Crea un link de pago cerrado (CLOSE) y devuelve la URL de checkout de Bold.
   * El total va en COP (no centavos); `amountInCents` viene en centavos.
   */
  async createPaymentUrl(params: CreatePaymentParams): Promise<string> {
    const totalCop = Math.round(params.amountInCents / 100)

    const body = {
      amount_type: 'CLOSE',
      amount: {
        currency: params.currency || 'COP',
        total_amount: totalCop,
      },
      description: `Pedido ${params.orderNumber}`,
      // Bold redirige aquí tras finalizar; conservamos el order para la confirmación
      callback_url: params.redirectUrl,
      payer_email: params.customerEmail,
      // Referencia externa de la venta. En el API "Link de pagos" es un campo de
      // NIVEL SUPERIOR (no metadata). Bold la devuelve en el webhook como
      // data.metadata.reference → correlación del pedido. Si no se envía, Bold
      // asigna el ID del link (LNK_*) y el webhook no casaría con el order_number.
      // Restricción de Bold: alfanumérico + '-'/'_', máx. 60 caracteres.
      reference: params.orderNumber,
    }

    const res = await fetch(`${BASE_URL}/online/link/v1`, {
      method: 'POST',
      headers: {
        Authorization: `x-api-key ${this.cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '(sin cuerpo)')
      throw new Error(`Bold createLink falló ${res.status}: ${text}`)
    }

    const data = await res.json() as { payload?: { url?: string; payment_link?: string }; errors?: unknown[] }
    const url = data.payload?.url
    if (!url) {
      throw new Error(`Bold createLink: respuesta sin payload.url (${JSON.stringify(data.errors ?? [])})`)
    }
    return url
  }

  /**
   * Verifica la firma del webhook de Bold:
   *   HMAC-SHA256( base64(rawBody), secretKey ) en hex === header x-bold-signature
   * En sandbox la llave secreta es un string vacío.
   */
  verifyWebhook(rawBody: string, headers: Record<string, string | null>): boolean {
    try {
      const signature = headers['x-bold-signature'] ?? headers['X-Bold-Signature'] ?? ''
      if (!signature) return false

      const secret  = this.cfg.sandbox ? '' : this.cfg.secretKey
      // Fail-closed en producción: sin llave secreta no se puede verificar la firma
      // (cualquiera podría forjar el HMAC con llave vacía). En sandbox se permite ''.
      if (!this.cfg.sandbox && !secret) return false
      const encoded = Buffer.from(rawBody, 'utf-8').toString('base64')
      const hashed  = createHmac('sha256', secret).update(encoded).digest('hex')

      const a = Buffer.from(hashed)
      const b = Buffer.from(signature)
      if (a.length !== b.length) return false
      return timingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  /**
   * Servicio de fallback de Bold: consulta el último estado de una transacción
   * por la referencia externa (nuestro order_number), útil cuando el webhook no
   * llega. Debe usarse SOLO como respaldo (Bold bloquea por exceso de peticiones).
   *
   * GET /payments/webhook/notifications/<ref>?is_external_reference=true
   * Devuelve el estado mapeado (priorizando SALE_APPROVED) o null si no hay datos.
   */
  async queryStatusByReference(
    reference: string,
  ): Promise<{ status: PaymentStatus; rawStatus: string; paymentId?: string } | null> {
    try {
      const url = `${BASE_URL}/payments/webhook/notifications/${encodeURIComponent(reference)}?is_external_reference=true`
      const res = await fetch(url, {
        headers: { Authorization: `x-api-key ${this.cfg.apiKey}` },
      })
      if (!res.ok) return null

      const data = await res.json() as {
        notifications?: Array<{ type?: string; subject?: string; data?: { payment_id?: string } }>
      }
      const list = data.notifications ?? []
      if (!list.length) return null

      // Preferimos una venta aprobada; si no, la última notificación recibida.
      const approved = list.find((n) => n.type === 'SALE_APPROVED')
      const chosen = approved ?? list[list.length - 1]
      const rawStatus = chosen?.type ?? ''
      if (!rawStatus) return null

      return {
        status: this.mapStatus(rawStatus),
        rawStatus,
        paymentId: chosen?.data?.payment_id ?? chosen?.subject ?? undefined,
      }
    } catch {
      return null
    }
  }

  mapStatus(rawStatus: string): PaymentStatus {
    switch (rawStatus) {
      case 'SALE_APPROVED': return 'approved'
      case 'SALE_REJECTED': return 'rejected'
      case 'VOID_APPROVED': return 'rejected' // anulación aprobada → el pago ya no es válido
      default:              return 'pending'  // VOID_REJECTED u otros → sin cambio determinante
    }
  }

  extractWebhookData(body: unknown): WebhookPaymentData | null {
    try {
      const evt = (typeof body === 'string' ? JSON.parse(body) : body) as {
        type?: string
        subject?: string
        data?: { payment_id?: string; amount?: { total?: number }; metadata?: { reference?: string } }
      }
      const orderReference = evt.data?.metadata?.reference
      const rawStatus      = evt.type
      const paymentId      = evt.data?.payment_id ?? evt.subject ?? undefined
      const amountCop      = typeof evt.data?.amount?.total === 'number' ? evt.data.amount.total : undefined

      if (!orderReference || !rawStatus) return null
      return { orderReference, rawStatus, paymentId: paymentId ?? undefined, amountCop }
    } catch {
      return null
    }
  }
}
