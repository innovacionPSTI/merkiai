import { createHash, timingSafeEqual } from 'crypto'
import type {
  CreatePaymentParams,
  PaymentGateway,
  PaymentStatus,
  WebhookPaymentData,
} from './types'

const WOMPI_CHECKOUT_BASE = 'https://checkout.wompi.co/p/'
// Bases de la API REST de Wompi (consulta autoritativa de transacciones).
const WOMPI_API_SANDBOX = 'https://sandbox.wompi.co/v1'
const WOMPI_API_PRODUCTION = 'https://production.wompi.co/v1'

export interface WompiConfig {
  publicKey: string
  integritySecret: string
  /** Secreto de eventos — requerido para verificar la firma de los webhooks. */
  eventsSecret?: string
  /** Llave privada — requerida para la RE-CONSULTA autoritativa por API (reconcile). */
  privateKey?: string
}

/** Resultado de una consulta autoritativa a la API de Wompi. */
export interface WompiQueryResult {
  status: PaymentStatus
  rawStatus: string
  paymentId: string
  reference?: string
  amountCop?: number
}

/**
 * Pasarela Wompi (Hosted Checkout + Webhooks + re-consulta por API).
 *
 * Fuente ÚNICA de la lógica de Wompi: el checkout usa `createPaymentUrl`, el
 * webhook verifica con `verifyWebhook`/`extractWebhookData` y la confirmación
 * reconcilia con `queryTransaction`. Las credenciales llegan desde payment_config
 * (por tenant); nunca desde process.env.
 */
export class WompiGateway implements PaymentGateway {
  readonly name = 'wompi'

  constructor(private readonly config: WompiConfig) {}

  /** Sandbox si la llave pública es de prueba (`pub_test_…`). */
  private get sandbox(): boolean {
    return /^pub_test_/.test(this.config.publicKey)
  }
  private get apiBase(): string {
    return this.sandbox ? WOMPI_API_SANDBOX : WOMPI_API_PRODUCTION
  }

  async createPaymentUrl(params: CreatePaymentParams): Promise<string> {
    const currency = params.currency ?? 'COP'

    const signature = createHash('sha256')
      .update(
        `${params.orderNumber}${params.amountInCents}${currency}${this.config.integritySecret}`,
      )
      .digest('hex')

    const url = new URL(WOMPI_CHECKOUT_BASE)
    url.searchParams.set('public-key', this.config.publicKey)
    url.searchParams.set('currency', currency)
    url.searchParams.set('amount-in-cents', String(params.amountInCents))
    url.searchParams.set('reference', params.orderNumber)
    url.searchParams.set('redirect-url', params.redirectUrl)
    url.searchParams.set('signature:integrity', signature)

    if (params.customerEmail) url.searchParams.set('customer-data:email', params.customerEmail)
    if (params.customerName) url.searchParams.set('customer-data:full-name', params.customerName)
    if (params.customerPhone) url.searchParams.set('customer-data:phone-number', params.customerPhone)

    return url.toString()
  }

  /**
   * Verifica la firma del webhook (SHA256(payload + timestamp + eventsSecret)).
   * FAIL-CLOSED: sin secreto o sin checksum se rechaza (no se asume válido), y la
   * comparación es en tiempo constante para no filtrar el checksum por timing.
   */
  verifyWebhook(rawBody: string, headers: Record<string, string | null>): boolean {
    const eventsSecret = this.config.eventsSecret ?? ''
    const timestamp = headers['x-timestamp'] ?? ''
    const checksum = headers['x-checksum'] ?? ''
    if (!eventsSecret || !checksum) {
      console.warn('[WompiGateway] eventsSecret/checksum ausente; webhook rechazado (fail-closed)')
      return false
    }
    const expected = createHash('sha256')
      .update(`${rawBody}${timestamp}${eventsSecret}`)
      .digest('hex')
    const a = Buffer.from(expected, 'utf-8')
    const b = Buffer.from(checksum, 'utf-8')
    if (a.length !== b.length) return false
    try { return timingSafeEqual(a, b) } catch { return false }
  }

  mapStatus(rawStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      APPROVED: 'approved',
      DECLINED: 'rejected',
      ERROR: 'rejected',
      VOIDED: 'rejected',
      PENDING: 'pending',
    }
    return map[rawStatus] ?? 'pending'
  }

  extractWebhookData(body: unknown): WebhookPaymentData | null {
    const event = body as Record<string, unknown>
    if (event.event !== 'transaction.updated') return null
    const data = event.data as Record<string, unknown> | undefined
    const transaction = data?.transaction as Record<string, unknown> | undefined
    if (!transaction) return null
    const orderReference = transaction.reference as string | undefined
    const rawStatus = transaction.status as string | undefined
    const paymentId = transaction.id as string | undefined
    const cents = typeof transaction.amount_in_cents === 'number' ? transaction.amount_in_cents : undefined
    if (!orderReference || !rawStatus) return null
    return { orderReference, rawStatus, paymentId, amountCop: cents != null ? cents / 100 : undefined }
  }

  /**
   * RE-CONSULTA AUTORITATIVA: pregunta a la API de Wompi por una transacción por
   * su id (el que llega en el redirect `?id=` o el `payment_id` guardado). Es la
   * fuente de verdad cuando el webhook no llegó. Devuelve null si no hay dato.
   */
  async queryTransaction(transactionId: string): Promise<WompiQueryResult | null> {
    if (!transactionId) return null
    try {
      // La llave privada da acceso completo; si no está, la pública permite leer.
      const bearer = this.config.privateKey || this.config.publicKey
      const res = await fetch(`${this.apiBase}/transactions/${encodeURIComponent(transactionId)}`, {
        headers: { Authorization: `Bearer ${bearer}` },
      })
      if (!res.ok) return null
      const body = await res.json() as {
        data?: { id?: string; status?: string; reference?: string; amount_in_cents?: number }
      }
      const t = body.data
      const rawStatus = t?.status
      if (!t?.id || !rawStatus) return null
      return {
        status: this.mapStatus(rawStatus),
        rawStatus,
        paymentId: t.id,
        reference: t.reference,
        amountCop: typeof t.amount_in_cents === 'number' ? t.amount_in_cents / 100 : undefined,
      }
    } catch {
      return null
    }
  }
}
