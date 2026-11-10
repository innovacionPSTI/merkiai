/**
 * @merkiai/tenancy — Adaptador `BillingProvider` para PayZen/Lyra (HU-440 · ADR-009).
 *
 * Contra la API REST V4 (https://payzen.io/lat/rest/V4.0/api/):
 *  - Autenticación HTTP Basic `shopId:password`.
 *  - `Charge/CreatePayment` (formAction REGISTER_PAY → formToken; con token → cobro SILENT).
 *  - `Charge/CreateSubscription` (token + rrule RFC-5545) y `Subscription/Cancel`.
 *  - IPN: `kr-hash` = HMAC-SHA256 hex de `kr-answer` con la contraseña; `orderStatus` PAID = aceptado.
 *
 * `fetch` se inyecta para poder probar sin red. Construido contra la documentación:
 * los nombres de campos de respuesta deben confirmarse con las llaves de prueba.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import type { BillingInterval, BillingProvider, NormalizedBillingWebhook } from './billing'

export interface PayzenConfig {
  shopId: string
  /** Contraseña REST (test o producción). Firma también las IPN. Secreto. */
  password: string
  /** Base de la API; por defecto la de LATAM. */
  baseUrl?: string
  fetchImpl?: typeof fetch
}

const DEFAULT_BASE = 'https://api.payzen.lat/api-payment/V4'

/** HMAC-SHA256 (hex) de `kr-answer` con la contraseña. */
export function payzenSignature(krAnswer: string, password: string): string {
  return createHmac('sha256', password).update(krAnswer, 'utf8').digest('hex')
}

/** Verifica `kr-hash` en tiempo constante. */
export function verifyPayzenIpn(fields: Record<string, string>, password: string): boolean {
  const answer = fields['kr-answer']; const hash = fields['kr-hash']
  if (!answer || !hash) return false
  if (fields['kr-hash-algorithm'] && fields['kr-hash-algorithm'] !== 'sha256_hmac') return false
  const expected = Buffer.from(payzenSignature(answer, password), 'utf8')
  const got = Buffer.from(hash.toLowerCase(), 'utf8')
  return expected.length === got.length && timingSafeEqual(expected, got)
}

/** Regla de recurrencia. Mensual: mismo día (tope 28 para no saltar meses cortos). */
export function payzenRrule(interval: BillingInterval, effectDate: string): string {
  if (interval === 'yearly') return 'RRULE:FREQ=YEARLY;INTERVAL=1'
  const day = Math.min(new Date(effectDate).getUTCDate(), 28)
  return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day};INTERVAL=1`
}

function outcomeOf(orderStatus: unknown): 'succeeded' | 'failed' | 'pending' {
  if (orderStatus === 'PAID') return 'succeeded'
  if (orderStatus === 'RUNNING' || orderStatus === 'PARTIALLY_PAID') return 'pending'
  return 'failed'
}

/** Normaliza un `kr-answer` (objeto V4/Payment) ya verificado. Puro. */
export function normalizePayzenAnswer(answer: any): NormalizedBillingWebhook {
  const tx = Array.isArray(answer?.transactions) ? answer.transactions[0] : undefined
  const meta = answer?.orderDetails?.metadata ?? tx?.metadata ?? null
  const eventKey = tx?.uuid ?? null
  if (!eventKey) throw new Error('[payzen] IPN sin uuid de transacción')
  return {
    eventKey: String(eventKey),
    tenantId: meta?.tenantId ? String(meta.tenantId) : null,
    outcome: outcomeOf(answer?.orderStatus),
    amountCents: typeof tx?.amount === 'number' ? tx.amount : null,
    currency: tx?.currency ?? answer?.orderDetails?.orderCurrency ?? null,
    paymentToken: tx?.paymentMethodToken ?? null,
    orderId: answer?.orderDetails?.orderId ?? null,
  }
}

export function createPayzenBillingProvider(cfg: PayzenConfig): BillingProvider {
  const base = (cfg.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '')
  const doFetch = cfg.fetchImpl ?? fetch
  const auth = 'Basic ' + Buffer.from(`${cfg.shopId}:${cfg.password}`).toString('base64')

  async function call(path: string, body: unknown): Promise<any> {
    const res = await doFetch(`${base}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: auth },
      body: JSON.stringify(body),
    })
    const json: any = await res.json().catch(() => null)
    if (!res.ok || !json || json.status !== 'SUCCESS') {
      const code = json?.answer?.errorCode ?? res.status
      throw new Error(`[payzen] ${path} falló (${code}): ${json?.answer?.errorMessage ?? 'respuesta inválida'}`)
    }
    return json.answer
  }

  return {
    id: 'payzen',
    async createRegisterAndPay(i) {
      const a = await call('Charge/CreatePayment', {
        amount: i.amountCents, currency: i.currency, orderId: i.orderId, formAction: 'REGISTER_PAY',
        customer: { email: i.email, reference: i.tenantId }, metadata: { tenantId: i.tenantId },
      })
      if (!a?.formToken) throw new Error('[payzen] CreatePayment sin formToken')
      return { formToken: String(a.formToken) }
    },
    async createSubscription(i) {
      const a = await call('Charge/CreateSubscription', {
        amount: i.amountCents, currency: i.currency, orderId: i.orderId, paymentMethodToken: i.paymentToken,
        effectDate: i.effectDate, rrule: payzenRrule(i.interval, i.effectDate), metadata: { tenantId: i.tenantId },
      })
      if (!a?.subscriptionId) throw new Error('[payzen] CreateSubscription sin subscriptionId')
      return { subscriptionId: String(a.subscriptionId) }
    },
    async chargeToken(i) {
      const a = await call('Charge/CreatePayment', {
        amount: i.amountCents, currency: i.currency, orderId: i.orderId, paymentMethodToken: i.paymentToken,
        formAction: 'SILENT', metadata: { tenantId: i.tenantId },
      })
      return { outcome: outcomeOf(a?.orderStatus), transactionId: a?.transactions?.[0]?.uuid ?? null }
    },
    async cancelSubscription(i) {
      await call('Subscription/Cancel', { paymentMethodToken: i.paymentToken, subscriptionId: i.subscriptionId })
    },
    parseWebhook(fields) {
      if (!verifyPayzenIpn(fields, cfg.password)) throw new Error('[payzen] firma de IPN inválida')
      return normalizePayzenAnswer(JSON.parse(fields['kr-answer']))
    },
  }
}
