import type { Db } from '../client'

/**
 * Rate-limit DISTRIBUIDO (HU-300) respaldado por la RPC `rate_limit_hit`
 * (contador por tenant+bucket+ident con bloqueo FOR UPDATE), efectivo entre
 * instancias serverless. Incluye un FALLBACK en memoria por si la RPC/infra no
 * responde (fail-safe: el límite sigue existiendo por instancia y nunca tumba
 * la request). Devuelve `justLocked` para alertar de abuso una sola vez.
 */
export interface RateLimitResult {
  allowed: boolean
  count: number
  blockedUntil: string | null
  justLocked: boolean
}

export interface RateLimitOptions {
  tenantId: string
  bucket: string
  ident: string
  windowSecs: number
  max: number
  lockSecs?: number
}

// ── Fallback en memoria (por instancia) ─────────────────────────────────────
const mem = new Map<string, { count: number; resetAt: number; blockedUntil: number }>()
function memHit(o: RateLimitOptions): RateLimitResult {
  const key = `${o.tenantId}|${o.bucket}|${o.ident}`
  const now = Date.now()
  let e = mem.get(key)
  if (!e || (e.blockedUntil && now >= e.blockedUntil && now - e.resetAt > o.windowSecs * 1000)) {
    e = { count: 0, resetAt: now, blockedUntil: 0 }
  }
  if (e.blockedUntil && now < e.blockedUntil) {
    mem.set(key, e)
    return { allowed: false, count: e.count, blockedUntil: new Date(e.blockedUntil).toISOString(), justLocked: false }
  }
  if (now - e.resetAt > o.windowSecs * 1000) { e.resetAt = now; e.count = 0; e.blockedUntil = 0 }
  e.count++
  let justLocked = false
  if (e.count > o.max) {
    if (o.lockSecs && !e.blockedUntil) { e.blockedUntil = now + o.lockSecs * 1000; justLocked = true }
    mem.set(key, e)
    return { allowed: false, count: e.count, blockedUntil: e.blockedUntil ? new Date(e.blockedUntil).toISOString() : null, justLocked }
  }
  mem.set(key, e)
  return { allowed: true, count: e.count, blockedUntil: null, justLocked: false }
}

export async function checkRateLimit(db: Db, o: RateLimitOptions): Promise<RateLimitResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any).rpc('rate_limit_hit', {
      p_tenant: o.tenantId,
      p_bucket: o.bucket,
      p_ident: o.ident,
      p_window_secs: o.windowSecs,
      p_max: o.max,
      p_lock_secs: o.lockSecs ?? 0,
    })
    if (error) throw error
    const r = (data ?? {}) as { allowed?: boolean; count?: number; blocked_until?: string | null; locked?: boolean }
    return {
      allowed: r.allowed !== false,
      count: Number(r.count ?? 0),
      blockedUntil: r.blocked_until ?? null,
      justLocked: r.locked === true,
    }
  } catch {
    // Fail-safe: si la RPC no está disponible, se usa el límite en memoria.
    return memHit(o)
  }
}
