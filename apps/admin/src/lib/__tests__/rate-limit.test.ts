import { rateLimit, __resetRateLimit } from '../rate-limit'

beforeEach(() => __resetRateLimit())

describe('rateLimit (ventana fija, en memoria)', () => {
  it('permite hasta el límite y luego bloquea con retryAfter', () => {
    const key = 'k'
    for (let i = 0; i < 3; i++) expect(rateLimit(key, { limit: 3, windowMs: 1000 }).ok).toBe(true)
    const blocked = rateLimit(key, { limit: 3, windowMs: 1000 })
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1)
  })

  it('claves distintas no se afectan entre sí', () => {
    expect(rateLimit('a', { limit: 1, windowMs: 1000 }).ok).toBe(true)
    expect(rateLimit('b', { limit: 1, windowMs: 1000 }).ok).toBe(true)
    expect(rateLimit('a', { limit: 1, windowMs: 1000 }).ok).toBe(false)
  })

  it('reinicia al vencer la ventana', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000)
    expect(rateLimit('t', { limit: 1, windowMs: 500 }).ok).toBe(true)
    expect(rateLimit('t', { limit: 1, windowMs: 500 }).ok).toBe(false)
    now.mockReturnValue(1_600) // pasó la ventana
    expect(rateLimit('t', { limit: 1, windowMs: 500 }).ok).toBe(true)
    now.mockRestore()
  })
})
