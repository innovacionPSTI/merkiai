import { createHash, timingSafeEqual } from 'crypto'

/**
 * Helpers puros del WEBHOOK de Wompi (verificación de firma, ventana de replay y
 * mapeo de estado). La construcción de la URL de pago y la re-consulta por API
 * viven en `WompiGateway` (@merkiai/database), que es la fuente única usada por el
 * checkout y el reconcile.
 *
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
