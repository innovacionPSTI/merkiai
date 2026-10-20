import { alreadySentEmail, retryAsync } from '../email-log'

describe('retryAsync (HU-162)', () => {
  it('devuelve al primer intento sin dormir si no falla', async () => {
    const sleep = jest.fn(async () => {})
    const fn = jest.fn(async () => 'ok')
    const r = await retryAsync(fn, { attempts: 3, sleep })
    expect(r).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('reintenta ante fallos transitorios y termina devolviendo', async () => {
    const sleep = jest.fn(async () => {})
    let n = 0
    const fn = jest.fn(async () => {
      n++
      if (n < 3) throw new Error('transient')
      return 'ok'
    })
    const r = await retryAsync(fn, { attempts: 3, sleep })
    expect(r).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2) // backoff entre intentos
  })

  it('lanza el último error si agota los intentos', async () => {
    const sleep = jest.fn(async () => {})
    const fn = jest.fn(async () => { throw new Error('down') })
    await expect(retryAsync(fn, { attempts: 2, sleep })).rejects.toThrow('down')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('alreadySentEmail (HU-162 idempotencia)', () => {
  function dbWithCount(count: number | null, shouldThrow = false) {
    const chain: Record<string, unknown> = {}
    const eq = jest.fn(() => chain)
    chain.eq = eq
    // la última .eq de la cadena resuelve como promesa con { count }
    ;(chain.eq as jest.Mock).mockImplementation(() => {
      // devuelve un thenable que también tiene .eq para encadenar
      const p: Record<string, unknown> = {
        eq: chain.eq,
        then: (res: (v: unknown) => void, rej: (e: unknown) => void) =>
          shouldThrow ? rej(new Error('db')) : res({ count }),
      }
      return p
    })
    const select = jest.fn(() => chain)
    return { from: jest.fn(() => ({ select })) }
  }

  it('devuelve false si falta la entidad', async () => {
    const db = dbWithCount(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await alreadySentEmail(db as any, { tenantId: 't1', type: 'order.confirmed', entity: null })).toBe(false)
  })

  it('devuelve true si ya hay un envío sent', async () => {
    const db = dbWithCount(1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await alreadySentEmail(db as any, { tenantId: 't1', type: 'order.confirmed', entity: 'ORD-1' })).toBe(true)
  })

  it('devuelve false si no hay envíos previos', async () => {
    const db = dbWithCount(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await alreadySentEmail(db as any, { tenantId: 't1', type: 'order.confirmed', entity: 'ORD-1' })).toBe(false)
  })

  it('best-effort: ante error de BD devuelve false (no bloquea el envío)', async () => {
    const db = dbWithCount(null, true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await alreadySentEmail(db as any, { tenantId: 't1', type: 'order.confirmed', entity: 'ORD-1' })).toBe(false)
  })
})
