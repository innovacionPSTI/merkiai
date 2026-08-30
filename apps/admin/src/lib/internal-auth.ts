/**
 * Guard de la API interna del admin (server-to-server).
 * Mismo patrón que la consola (`x-internal-secret`, timing-safe, sin Origin).
 * Se usa para que el **control plane (consola)** cree recursos en la BD del admin
 * al aprovisionar (p.ej. el `profiles` del dueño). No exponer públicamente.
 */
import { timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/** Longitud mínima aceptable del secreto (evita deploy con secreto débil/blanco). */
export const MIN_SECRET_LEN = 24

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

/**
 * ¿El secreto está bien configurado? Fail-closed: si falta o es demasiado corto,
 * el endpoint debe responder 500 (misconfig) en vez de operar con un secreto débil.
 */
export function internalSecretConfigured(): boolean {
  const s = process.env.INTERNAL_API_SECRET
  return !!s && s.length >= MIN_SECRET_LEN
}

export function hasInternalSecret(req: NextRequest): boolean {
  // Bloquea navegador (cross-origin): solo server-to-server.
  if (req.headers.get('origin')) return false
  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers.get('x-internal-secret')
  // Nunca autoriza con un secreto ausente o débil (aunque el cliente "acierte").
  if (!expected || expected.length < MIN_SECRET_LEN || !provided) return false
  return safeEqual(provided, expected)
}
