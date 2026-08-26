/**
 * Guard interino de la API interna del console (HU-202).
 *  - Compara el secreto con **timing-safe** (evita ataques de temporización).
 *  - Rechaza peticiones con header `Origin` (los navegadores lo envían en
 *    cross-origin; las llamadas server-to-server no) → sólo máquina-a-máquina.
 *
 * ⚠️ Interino. El gate definitivo de la operación humana es Stack Auth
 * (`platform:operate`, ver `platform-auth.ts`). Estos endpoints NO deben
 * exponerse públicamente.
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
  // Bloquea acceso desde navegador (cross-origin) — solo server-to-server.
  if (req.headers.get('origin')) return false

  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers.get('x-internal-secret')
  if (!expected || !provided) return false
  return safeEqual(provided, expected)
}
