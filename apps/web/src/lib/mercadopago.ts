import { createHmac, timingSafeEqual } from 'crypto'

const MP_API_BASE = 'https://api.mercadopago.com'

export interface MPItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

export interface MPBackUrls {
  success: string
  failure: string
  pending: string
}

export interface MPPreferenceResult {
  id: string
  init_point: string
  sandbox_init_point: string
}

/**
 * Crea una preferencia de pago en MercadoPago.
 * Docs: https://www.mercadopago.com.co/developers/es/reference/preferences/_checkout_preferences/post
 *
 * El accessToken se lee desde la BD (payment_config); no usa process.env.
 */
export async function createMercadoPagoPreference(
  accessToken: string,
  params: {
    externalReference: string
    items: MPItem[]
    payerEmail: string
    backUrls: MPBackUrls
    notificationUrl: string
  },
): Promise<MPPreferenceResult> {
  const body = {
    external_reference: params.externalReference,
    items: params.items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: item.currency_id ?? 'COP',
    })),
    payer: { email: params.payerEmail },
    back_urls: params.backUrls,
    auto_return: 'approved',
    notification_url: params.notificationUrl,
    statement_descriptor: 'Mi Tienda',
  }

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MercadoPago API error ${res.status}: ${err}`)
  }

  return res.json() as Promise<MPPreferenceResult>
}

/**
 * Consulta el estado de un pago en MercadoPago por su ID.
 * Usado desde el webhook para obtener external_reference y status reales.
 */
export async function getMercadoPagoPayment(
  accessToken: string,
  paymentId: string,
): Promise<{
  id: number
  status: string
  external_reference: string
  transaction_amount: number
}> {
  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MercadoPago payment fetch error ${res.status}: ${err}`)
  }

  return res.json()
}

/**
 * Verifica la firma `x-signature` de MercadoPago (defensa en profundidad; el control
 * primario es la re-consulta del pago a la API de MP).
 * Doc: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 *
 * `x-signature` = "ts=<unix>,v1=<hmac_hex>"; el manifest es
 *   `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * y v1 = HMAC-SHA256(manifest, secret) en hex.
 *
 * Devuelve `true`/`false` si se puede verificar, o `null` si no hay secreto
 * configurado (se omite y se confía en la re-consulta).
 */
export function verifyMercadoPagoSignature(params: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string
  secret: string | null | undefined
}): boolean | null {
  const { xSignature, xRequestId, dataId, secret } = params
  if (!secret) return null
  if (!xSignature || !dataId) return false

  const parts: Record<string, string> = {}
  for (const kv of xSignature.split(',')) {
    const idx = kv.indexOf('=')
    if (idx === -1) continue
    parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim()
  }
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // MP recomienda usar el data.id en minúsculas si es alfanumérico.
  const id = /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId
  const manifest = `id:${id};request-id:${xRequestId ?? ''};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  const a = Buffer.from(expected, 'utf-8')
  const b = Buffer.from(v1, 'utf-8')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

/** Mapea el status de MercadoPago a nuestros valores internos */
export function mapMercadoPagoStatus(mpStatus: string): 'approved' | 'rejected' | 'pending' {
  const map: Record<string, 'approved' | 'rejected' | 'pending'> = {
    approved: 'approved',
    authorized: 'approved',
    rejected: 'rejected',
    cancelled: 'rejected',
    refunded: 'rejected',
    charged_back: 'rejected',
    pending: 'pending',
    in_process: 'pending',
    in_mediation: 'pending',
  }
  return map[mpStatus] ?? 'pending'
}

/** Un access token TEST-... es de sandbox */
export function isMercadoPagoSandbox(accessToken: string): boolean {
  return accessToken.startsWith('TEST-')
}
