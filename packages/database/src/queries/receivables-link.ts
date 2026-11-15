/**
 * queries/receivables-link.ts — Enlace de pago del saldo (E27 · HU-455). PURO.
 *
 * El admin genera un enlace público firmado a la tienda (`/pagar-saldo?d=&s=`);
 * el storefront lo verifica y crea el pago con la pasarela activa. La referencia
 * del pago (`CXC-<docId>-<ts>`) le dice a los webhooks que es un abono de
 * cartera y no un pedido. Firma HMAC-SHA256 con separación de dominio.
 */
import { createHmac, timingSafeEqual } from 'crypto'

const DOMAIN = 'merkiai:receivable-pay:v1'

export function signReceivableLink(tenantId: string, documentId: number, secret: string): string {
  return createHmac('sha256', secret).update(`${DOMAIN}:${tenantId}:${documentId}`).digest('base64url')
}

export function verifyReceivableLink(tenantId: string, documentId: number, sig: string | null | undefined, secret: string | undefined): boolean {
  if (!sig || !secret || !Number.isInteger(documentId) || documentId <= 0) return false
  const a = Buffer.from(signReceivableLink(tenantId, documentId, secret))
  const b = Buffer.from(sig)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Referencia de pago para la pasarela (≤ 64, solo [A-Za-z0-9-]). */
export function receivablePaymentReference(documentId: number, now = Date.now()): string {
  return `CXC-${documentId}-${now}`
}

export function parseReceivableReference(ref: string | null | undefined): { documentId: number } | null {
  const m = ref?.match(/^CXC-(\d+)-\d+$/)
  return m ? { documentId: Number(m[1]) } : null
}
