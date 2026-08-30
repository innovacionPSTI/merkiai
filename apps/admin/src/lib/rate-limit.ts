/**
 * Rate limiter de ventana fija, en memoria (HU-209 · endurecimiento).
 *
 * ⚠️ Best-effort: el estado es **por instancia** del proceso. En serverless con
 * varias instancias, un atacante distribuido lo diluye. Es una barrera contra
 * fuerza bruta del secreto interno, NO el control definitivo (ese es el secreto
 * fuerte + red interna). Para límites duros/compartidos usar un store externo
 * (Upstash/Redis) — registrado como mejora.
 */
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export interface RateLimitResult { ok: boolean; retryAfterSec: number }

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now()

  // Limpieza oportunista para no crecer sin límite.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k)
  }

  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true, retryAfterSec: 0 }
  }
  if (b.count >= opts.limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) }
  }
  b.count++
  return { ok: true, retryAfterSec: 0 }
}

/** Solo para tests: reinicia el estado. */
export function __resetRateLimit(): void {
  buckets.clear()
}
