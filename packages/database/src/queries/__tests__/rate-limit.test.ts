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
