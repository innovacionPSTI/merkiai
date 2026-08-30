/**
 * Guard de la API interna del admin (server-to-server).
 * Mismo patrón que la consola (`x-internal-secret`, timing-safe, sin Origin).
 * Se usa para que el **control plane (consola)** cree recursos en la BD del admin
 * al aprovisionar (p.ej. el `profiles` del dueño). No exponer públicamente.
 */
import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  try {
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export function hasInternalSecret(req: NextRequest): boolean {
  // Bloquea navegador (cross-origin): solo server-to-server.
  if (req.headers.get('origin')) return false
  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers.get('x-internal-secret')
  if (!expected || !provided) return false
  return safeEqual(provided, expected)
}
