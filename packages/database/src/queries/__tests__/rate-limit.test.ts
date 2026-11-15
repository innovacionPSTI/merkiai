import { checkRateLimit } from '../rate-limit'

describe('checkRateLimit (HU-300 distribuido)', () => {
  it('usa el resultado de la RPC cuando está disponible', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: { allowed: true, count: 3, blocked_until: null, locked: false }, error: null })
    const r = await checkRateLimit({ rpc } as any, { tenantId: 't1', bucket: 'checkout.coupon', ident: '1.1.1.1', windowSecs: 60, max: 20, lockSecs: 300 })
    expect(rpc).toHaveBeenCalledWith('rate_limit_hit', expect.objectContaining({ p_bucket: 'checkout.coupon', p_max: 20, p_lock_secs: 300 }))
    expect(r.allowed).toBe(true)
    expect(r.count).toBe(3)
  })

  it('propaga el bloqueo (locked=justLocked) desde la RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: { allowed: false, count: 21, blocked_until: '2026-01-01T00:00:00Z', locked: true }, error: null })
    const r = await checkRateLimit({ rpc } as any, { tenantId: 't1', bucket: 'checkout.credit', ident: 'ip', windowSecs: 60, max: 20, lockSecs: 300 })
    expect(r.allowed).toBe(false)
    expect(r.justLocked).toBe(true)
    expect(r.blockedUntil).toBe('2026-01-01T00:00:00Z')
  })

  it('fallback en memoria si la RPC falla: permite bajo el máximo y niega al superarlo', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: new Error('no rpc') })
    const opts = { tenantId: 't-mem', bucket: 'b', ident: 'ip-mem', windowSecs: 60, max: 3, lockSecs: 0 }
    const results = []
    for (let i = 0; i < 5; i++) results.push(await checkRateLimit({ rpc } as any, opts))
    expect(results.slice(0, 3).every((r) => r.allowed)).toBe(true)
    expect(results[3].allowed).toBe(false)
    expect(results[4].allowed).toBe(false)
  })
})

describe('HU-434 · rate limit en Redis (Upstash REST)', () => {
  // Simulador mínimo de Redis para el pipeline REST.
  function fakeRedis() {
    const kv = new Map<string, { v: string; exp: number | null }>()
    const now = () => Date.now()
    const get = (k: string) => { const e = kv.get(k); if (e && e.exp !== null && e.exp <= now()) { kv.delete(k); return undefined } return e }
    const run = (c: (string | number)[]): unknown => {
      const [cmd, k, ...a] = c as [string, string, ...(string | number)[]]
      if (cmd === 'PTTL') { const e = get(k); return !e ? -2 : e.exp === null ? -1 : e.exp - now() }
      if (cmd === 'INCR') { const e = get(k); const v = String(Number(e?.v ?? 0) + 1); kv.set(k, { v, exp: e?.exp ?? null }); return Number(v) }
      if (cmd === 'PEXPIRE') { const e = get(k); if (!e || e.exp !== null) return 0; e.exp = now() + Number(a[0]); return 1 }
      if (cmd === 'SET') { if (get(k)) return null; kv.set(k, { v: String(a[0]), exp: now() + Number(a[2]) }); return 'OK' }
      throw new Error('cmd ' + cmd)
    }
    const fetchImpl = (async (_url: string, init: { body: string }) => ({
      ok: true, json: async () => (JSON.parse(init.body) as (string | number)[][]).map((c) => ({ result: run(c) })),
    })) as unknown as typeof fetch
    return { fetchImpl }
  }

  it('permite hasta max, luego bloquea una sola vez (justLocked) y mantiene el bloqueo', async () => {
    const { redisRateLimitHit } = await import('../rate-limit')
    const { fetchImpl } = fakeRedis()
    const cfg = { url: 'https://r', token: 't' }
    const o = { tenantId: 't1', bucket: 'b', ident: '1.2.3.4', windowSecs: 60, max: 2, lockSecs: 300 }
    expect((await redisRateLimitHit(o, cfg, fetchImpl)).allowed).toBe(true)
    expect((await redisRateLimitHit(o, cfg, fetchImpl)).allowed).toBe(true)
    const third = await redisRateLimitHit(o, cfg, fetchImpl)
    expect(third).toMatchObject({ allowed: false, justLocked: true })
    const fourth = await redisRateLimitHit(o, cfg, fetchImpl)
    expect(fourth).toMatchObject({ allowed: false, justLocked: false })
    expect(fourth.blockedUntil).not.toBeNull()
  })

  it('config solo con URL y token', async () => {
    const { redisConfigFromEnv } = await import('../rate-limit')
    expect(redisConfigFromEnv({})).toBeNull()
    expect(redisConfigFromEnv({ UPSTASH_REDIS_REST_URL: 'https://x/', UPSTASH_REDIS_REST_TOKEN: 'k' })).toEqual({ url: 'https://x', token: 'k' })
  })

  it('si Redis falla, checkRateLimit cae a la RPC', async () => {
    const { checkRateLimit } = await import('../rate-limit')
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.invalid'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'k'
    const orig = global.fetch
    global.fetch = (async () => { throw new Error('down') }) as unknown as typeof fetch
    const db = { rpc: async () => ({ data: { allowed: true, count: 1 }, error: null }) }
    try {
      const r = await checkRateLimit(db as never, { tenantId: 't', bucket: 'b', ident: 'i', windowSecs: 60, max: 5 })
      expect(r).toMatchObject({ allowed: true, count: 1 })
    } finally {
      global.fetch = orig
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
    }
  })
})
