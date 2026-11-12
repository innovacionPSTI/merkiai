/**
 * PayzenGateway — PayZen/Lyra para las VENTAS de la tienda (HU-442 · ADR-009).
 * Documentación: https://payzen.io/lat/rest/V4.0/api/playground/Charge/CreatePaymentOrder/
 *
 * Flujo (enlace de pago, encaja con el checkout por redirección):
 *   1. POST Charge/CreatePaymentOrder (Basic auth `shopId:password`) → `answer.paymentURL`.
 *   2. Se redirige al comprador a esa URL (página de pago hospedada por PayZen).
 *   3. PayZen notifica por IPN (form-urlencoded `kr-answer` + `kr-hash` =
 *      HMAC-SHA256 hex de `kr-answer` con la contraseña). `kr-src` = PAYMENT_ORDER.
 *
 * Correlación: `orderId` = order_number (vuelve en `orderDetails.orderId`).
 * Montos: PayZen trabaja en la unidad más pequeña (centavos de COP) = `amountInCents`.
 *
 * Sirve a dos modelos: BYO (el tenant trae su tienda PayZen, HU-442) y
 * "Merkiai Pagos" (tienda PayZen gestionada por Merkiai, HU-441): mismo gateway,
 * cambia de dónde salen las credenciales.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import type { PaymentGateway, CreatePaymentParams, PaymentStatus, WebhookPaymentData } from './types'

export interface PayzenConfig {
  shopId: string
  /** Contraseña REST (`testpassword_…` / `prodpassword_…`). También firma las IPN. */
  password: string
  apiUrl?: string
  /** Nombre del gateway para logs/método de pago (default 'payzen'). */
  name?: string
}

const DEFAULT_API = 'https://api.payzen.lat/api-payment/V4'

/** Entorno por el prefijo de la contraseña. */
export function payzenEnvFromPassword(password: string | undefined): 'test' | 'production' | 'unknown' {
  if (!password) return 'unknown'
  if (password.startsWith('prodpassword_')) return 'production'
  if (password.startsWith('testpassword_')) return 'test'
  return 'unknown'
}

/** Lee los campos de una IPN (form-urlencoded) o acepta un objeto ya parseado. */
export function parsePayzenIpn(body: unknown): Record<string, string> {
  if (typeof body === 'string') return Object.fromEntries(new URLSearchParams(body).entries())
  if (body && typeof body === 'object') return Object.fromEntries(Object.entries(body as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
  return {}
}

export class PayzenGateway implements PaymentGateway {
  readonly name: string

  constructor(private readonly cfg: PayzenConfig) {
    this.name = cfg.name ?? 'payzen'
  }

  private get auth(): string {
    return 'Basic ' + Buffer.from(`${this.cfg.shopId}:${this.cfg.password}`).toString('base64')
  }

  async createPaymentUrl(params: CreatePaymentParams): Promise<string> {
    const body = {
      amount: Math.round(params.amountInCents),
      currency: params.currency || 'COP',
      orderId: params.orderNumber,
      channelOptions: { channelType: 'URL' },
      locale: 'es_ES',
      customer: {
        email: params.customerEmail,
        reference: params.orderNumber,
        billingDetails: { firstName: params.customerName, cellPhoneNumber: params.customerPhone },
      },
      // Todos los retornos llevan a la confirmación del pedido (el estado real lo fija la IPN).
      returnUrl: params.redirectUrl,
      successUrl: params.redirectUrl,
      refusedUrl: params.redirectUrl,
      cancelUrl: params.redirectUrl,
      errorUrl: params.redirectUrl,
      // La URL de IPN viaja por pedido para no exigir configurarla tienda por tienda
      // en el Back Office (multi-tenant: cada tenant tiene su host).
      ipnTargetUrl: params.webhookUrl,
      metadata: { orderNumber: params.orderNumber },
    }
    const res = await fetch(`${(this.cfg.apiUrl ?? DEFAULT_API).replace(/\/$/, '')}/Charge/CreatePaymentOrder`, {
      method: 'POST',
      headers: { Authorization: this.auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as { status?: string; answer?: { paymentURL?: string; errorCode?: string; errorMessage?: string } } | null
    if (!res.ok || data?.status !== 'SUCCESS' || !data.answer?.paymentURL) {
      throw new Error(`PayZen CreatePaymentOrder falló (${data?.answer?.errorCode ?? res.status}): ${data?.answer?.errorMessage ?? 'sin paymentURL'}`)
    }
    return data.answer.paymentURL
  }

  /** `kr-hash` = HMAC-SHA256 hex de `kr-answer` con la contraseña. Tiempo constante. */
  verifyWebhook(rawBody: string): boolean {
    try {
      const f = parsePayzenIpn(rawBody)
      const answer = f['kr-answer']
      const hash = f['kr-hash']
      if (!answer || !hash || !this.cfg.password) return false
      if (f['kr-hash-algorithm'] && f['kr-hash-algorithm'] !== 'sha256_hmac') return false
      const expected = Buffer.from(createHmac('sha256', this.cfg.password).update(answer, 'utf8').digest('hex'))
      const got = Buffer.from(hash.toLowerCase())
      return expected.length === got.length && timingSafeEqual(expected, got)
    } catch {
      return false
    }
  }

  mapStatus(rawStatus: string): PaymentStatus {
    switch (rawStatus) {
      case 'PAID': return 'approved'
      case 'UNPAID': return 'rejected'
      default: return 'pending' // RUNNING, PARTIALLY_PAID, ABANDONED (el enlace sigue vigente)
    }
  }

  extractWebhookData(body: unknown): WebhookPaymentData | null {
    try {
      const f = parsePayzenIpn(body)
      if (!f['kr-answer']) return null
      const ans = JSON.parse(f['kr-answer']) as {
        orderStatus?: string
        orderDetails?: { orderId?: string }
        transactions?: Array<{ uuid?: string; amount?: number }>
      }
      const orderReference = ans.orderDetails?.orderId
      const rawStatus = ans.orderStatus
      if (!orderReference || !rawStatus) return null
      const tx = ans.transactions?.[0]
      return {
        orderReference,
        rawStatus,
        paymentId: tx?.uuid,
        amountCop: typeof tx?.amount === 'number' ? tx.amount / 100 : undefined,
      }
    } catch {
      return null
    }
  }
}
