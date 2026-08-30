/**
 * Guard centralizado para rutas `/api/internal/*` (server-to-server).
 *
 * Envuelve un handler con TODA la protección, para que ninguna ruta interna
 * pueda "olvidar" el chequeo del secreto (el middleware ya no exige sesión en
 * este prefijo — ver apps/admin/src/middleware.ts). Orden:
 *   1. Fail-closed: 500 si el secreto no está bien configurado.
 *   2. Rate-limit por IP (best-effort) → 429.
 *   3. Secreto `x-internal-secret` (timing-safe, sin Origin) → 401.
 * Registra en logs los intentos fallidos (sin exponer el secreto) para dar
 * visibilidad ante sondeos (antes eran invisibles).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { hasInternalSecret, internalSecretConfigured } from './internal-auth'
import { rateLimit } from './rate-limit'

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

type Handler = (req: NextRequest) => Promise<Response> | Response

export function withInternalAuth(
  handler: Handler,
  opts: { limit?: number; windowMs?: number } = {},
): Handler {
  const limit = opts.limit ?? 10
  const windowMs = opts.windowMs ?? 60_000

  return async (req: NextRequest): Promise<Response> => {
    const path = req.nextUrl?.pathname ?? '(desconocido)'

    // 1. Fail-closed: nunca operar con secreto ausente/débil.
    if (!internalSecretConfigured()) {
      console.error(`[internal-auth] ${path}: INTERNAL_API_SECRET ausente o < 24 chars (misconfig)`)
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // 2. Rate-limit por IP (frena fuerza bruta del secreto).
    const ip = clientIp(req)
    const rl = rateLimit(`internal:${path}:${ip}`, { limit, windowMs })
    if (!rl.ok) {
      console.warn(`[internal-auth] ${path}: rate-limit excedido ip=${ip}`)
      return NextResponse.json({ error: 'Too Many Requests' }, {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      })
    }

    // 3. Secreto server-to-server.
    if (!hasInternalSecret(req)) {
      console.warn(`[internal-auth] ${path}: secreto inválido/ausente ip=${ip}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req)
  }
}
