/**
 * Token de vista previa **por-tenant** (HU-128). Deriva un token distinto por
 * tenant desde UN secreto de servidor (`PREVIEW_SIGNING_SECRET`), sin storage y
 * sin un secreto global compartido entre tiendas: un token filtrado solo sirve
 * para su propio tenant. Puro y testeable (HMAC-SHA256, comparación timing-safe).
 *
 * Reemplaza el `DRAFT_SECRET` global del preview de blog.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Token de preview para un tenant (hex de 64 chars). */
export function makePreviewToken(tenantId: string, secret: string): string {
  return createHmac('sha256', secret).update(`preview:${tenantId}`).digest('hex')
}

/** ¿El token corresponde a este tenant? Timing-safe; false si falta secreto/token. */
export function verifyPreviewToken(token: string | null | undefined, tenantId: string, secret: string | undefined): boolean {
  if (!secret || !token || !tenantId) return false
  const expected = makePreviewToken(tenantId, secret)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
