import { createHash, timingSafeEqual } from 'crypto'

const WOMPI_CHECKOUT_BASE = 'https://checkout.wompi.co/p/'

/**
 * Construye la URL de pago de Wompi (Hosted Checkout).
 * Docs: https://docs.wompi.co/docs/en/widget-checkout-web
 *
 * La firma de integridad es SHA256(`{reference}{amountInCents}{currency}{integritySecret}`)
 * Las credenciales se leen desde la BD vía getPaymentConfig(); no usan process.env.
 */
export function buildWompiCheckoutUrl(params: {
  publicKey: string
  integritySecret: string
  reference: string
  amountInCents: number
  currency?: string
  redirectUrl: string
  customerData?: {
    email?: string
    fullName?: string
    phoneNumber?: string
    legalId?: string
    legalIdType?: string
  }
}): string {
  const currency = params.currency ?? 'COP'
  const signature = createHash('sha256')
    .update(`${params.reference}${params.amountInCents}${currency}${params.integritySecret}`)
    .digest('hex')

  const url = new URL(WOMPI_CHECKOUT_BASE)
  url.searchParams.set('public-key', params.publicKey)
  url.searchParams.set('currency', currency)
  url.searchParams.set('amount-in-cents', String(params.amountInCents))
  url.searchParams.set('reference', params.reference)
  url.searchParams.set('redirect-url', params.redirectUrl)
  url.searchParams.set('signature:integrity', signature)

  if (params.customerData?.email) {
    url.searchParams.set('customer-data:email', params.customerData.email)
  }
  if (params.customerData?.fullName) {
    url.searchParams.set('customer-data:full-name', params.customerData.fullName)
  }
  if (params.customerData?.phoneNumber) {
    url.searchParams.set('customer-data:phone-number', params.customerData.phoneNumber)
  }
  if (params.customerData?.legalId) {
    url.searchParams.set('customer-data:legal-id', params.customerData.legalId)
  }
  if (params.customerData?.legalIdType) {
    url.searchParams.set('customer-data:legal-id-type', params.customerData.legalIdType)
  }

  return url.toString()
}

/**
 * Verifica la firma del webhook de Wompi.
 * Cabeceras: x-timestamp, x-checksum
 * Firma esperada: SHA256(`{payload}{timestamp}{eventsSecret}`)
 */
export function verifyWompiWebhook(
  payload: string,
  timestamp: string,
  checksum: string,
  eventsSecret: string,
): boolean {
  // Fail-closed: sin secreto o sin checksum NO se puede verificar → se rechaza.
  // (Antes se omitía la verificación con secreto vacío, lo que permitía forjar un
  // evento "APPROVED" y validar un pago inexistente.)
  if (!eventsSecret || !checksum) {
    console.warn('[wompi] eventsSecret/checksum ausente; se rechaza el webhook (fail-closed)')
    return false
  }
  const expected = createHash('sha256')
    .update(`${payload}${timestamp}${eventsSecret}`)
    .digest('hex')
  // Comparación en tiempo constante (evita timing attacks sobre el checksum).
  const a = Buffer.from(expected, 'utf-8')
  const b = Buffer.from(checksum, 'utf-8')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

/**
 * Ventana de replay: el webhook trae `x-timestamp` (Unix en ms). Se rechaza si es
 * demasiado antiguo (o futuro), para mitigar el reenvío de un evento válido antiguo.
 * La firma cubre el timestamp, así que no se puede alterar sin invalidarla.
 */
export function isWompiTimestampFresh(timestamp: string, maxAgeMs = 300_000): boolean {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || ts <= 0) return false
  return Math.abs(Date.now() - ts) <= maxAgeMs
}

/** Mapea el status de Wompi a nuestros valores internos */
export function mapWompiStatus(wompiStatus: string): 'approved' | 'rejected' | 'pending' {
  const map: Record<string, 'approved' | 'rejected' | 'pending'> = {
    APPROVED: 'approved',
    DECLINED: 'rejected',
    ERROR: 'rejected',
    VOIDED: 'rejected',
    PENDING: 'pending',
  }
  return map[wompiStatus] ?? 'pending'
}
