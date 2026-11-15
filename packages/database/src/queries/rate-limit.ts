import type { Db } from '../client'

/**
 * Rate-limit DISTRIBUIDO (HU-300 · HU-434). Orden de respaldo:
 *   1. Redis (Upstash REST) si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *      están definidos — HU-434: rápido y sin carga en la BD.
 *   2. RPC `rate_limit_hit` de Postgres.
 *   3. Memoria por instancia (último recurso).
 *
 * Detalle del tier 2: RPC `rate_limit_hit`
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

// ── HU-434 · Redis (Upstash REST) ────────────────────────────────────────────

export interface RedisRestConfig { url: string; token: string }

export function redisConfigFromEnv(env: Record<string, string | undefined> = process.env): RedisRestConfig | null {
  const url = env.UPSTASH_REDIS_REST_URL?.trim()
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url: url.replace(/\/$/, ''), token } : null
}

type Fetch = typeof fetch

async function redisPipeline(cfg: RedisRestConfig, cmds: (string | number)[][], fetchImpl: Fetch): Promise<unknown[]> {
  const res = await fetchImpl(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
    cache: 'no-store',
    signal: AbortSignal.timeout(1500),
  })
  if (!res.ok) throw new Error(`redis ${res.status}`)
  const out = (await res.json()) as { result?: unknown; error?: string }[]
  return out.map((r) => { if (r.error) throw new Error(r.error); return r.result })
}

/**
 * Ventana fija con contador `INCR` + `PEXPIRE` y llave de bloqueo `SET NX PX`.
 * Lanza si Redis no responde (el llamador cae al siguiente tier).
 */
export async function redisRateLimitHit(o: RateLimitOptions, cfg: RedisRestConfig, fetchImpl: Fetch = fetch): Promise<RateLimitResult> {
  const base = `rl:${o.tenantId}:${o.bucket}:${o.ident}`
  const lockKey = `${base}:lock`
  const countKey = `${base}:n`
  const [lockTtl] = (await redisPipeline(cfg, [['PTTL', lockKey]], fetchImpl)) as number[]
  if (typeof lockTtl === 'number' && lockTtl > 0) {
    return { allowed: false, count: o.max + 1, blockedUntil: new Date(Date.now() + lockTtl).toISOString(), justLocked: false }
  }
  const [count] = (await redisPipeline(cfg, [['INCR', countKey], ['PEXPIRE', countKey, o.windowSecs * 1000, 'NX']], fetchImpl)) as number[]
  const n = Number(count)
  if (n <= o.max) return { allowed: true, count: n, blockedUntil: null, justLocked: false }
  if (!o.lockSecs) return { allowed: false, count: n, blockedUntil: null, justLocked: false }
  const [set] = await redisPipeline(cfg, [['SET', lockKey, '1', 'PX', o.lockSecs * 1000, 'NX']], fetchImpl)
  return { allowed: false, count: n, blockedUntil: new Date(Date.now() + o.lockSecs * 1000).toISOString(), justLocked: set === 'OK' }
}

export async function checkRateLimit(db: Db, o: RateLimitOptions): Promise<RateLimitResult> {
  const redis = redisConfigFromEnv()
  if (redis) {
    try { return await redisRateLimitHit(o, redis) } catch { /* cae a la RPC */ }
  }
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
