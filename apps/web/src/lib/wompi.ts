import { createHash, timingSafeEqual } from 'crypto'

/**
 * Helpers puros del WEBHOOK de Wompi (verificación de firma, ventana de replay y
 * mapeo de estado). La construcción de la URL de pago y la re-consulta por API
 * viven en `WompiGateway` (@merkiai/database), fuente única del checkout/reconcile.
 *
 * Firma del webhook de Wompi COLOMBIA (docs.wompi.co/en/docs/colombia/eventos):
 *  - El checksum viene en el header `X-Event-Checksum` **y** en `signature.checksum`.
 *  - checksum = SHA256( concat(valores de `signature.properties` tomados de `data`)
 *    + `timestamp` (entero del body) + events_secret ).
 *  - El timestamp usado es el del BODY (no un header), en segundos Unix.
 */
export interface WompiEvent {
  event?: string
  data?: Record<string, unknown>
  timestamp?: number
  signature?: { properties?: string[]; checksum?: string }
  [k: string]: unknown
}

function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
    obj,
  )
}

export function verifyWompiWebhook(
  event: WompiEvent,
  eventsSecret: string,
  headerChecksum?: string,
): boolean {
  const sig = event.signature
  const checksum = (headerChecksum || sig?.checksum || '').trim()
  const props = sig?.properties
  // Fail-closed: sin secreto, sin checksum o sin properties NO se puede verificar.
  if (!eventsSecret || !checksum || !Array.isArray(props) || props.length === 0) {
    console.warn('[wompi] eventsSecret/checksum/properties ausente; se rechaza el webhook (fail-closed)')
    return false
  }
  // Concatena los valores de las properties (resueltas contra `data`), luego el
  // timestamp del body y el secreto; SHA256 hex.
  const concatenated = props
    .map((p) => {
      const v = resolvePath(event.data, p)
      return v === undefined || v === null ? '' : String(v)
    })
    .join('')
  const expected = createHash('sha256')
    .update(`${concatenated}${event.timestamp ?? ''}${eventsSecret}`)
    .digest('hex')
  // Comparación en tiempo constante, insensible a mayúsculas (Wompi usa hex upper).
  const a = Buffer.from(expected.toLowerCase(), 'utf-8')
  const b = Buffer.from(checksum.toLowerCase(), 'utf-8')
  if (a.length !== b.length) return false
  try { return timingSafeEqual(a, b) } catch { return false }
}

/**
 * Ventana de replay: el `timestamp` del body (Unix, segundos) debe estar dentro de
 * ±5 min. La firma cubre el timestamp, así que no se puede alterar sin invalidarla.
 */
export function isWompiTimestampFresh(timestamp: string | number | undefined, maxAgeMs = 300_000): boolean {
  let ts = Number(timestamp)
  if (!Number.isFinite(ts) || ts <= 0) return false
  if (ts < 1e12) ts *= 1000 // Wompi envía segundos; normaliza a ms
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
