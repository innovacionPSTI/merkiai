import { isTenantBlocked } from '../tenant-status'

describe('isTenantBlocked (HU-194 · gate del admin)', () => {
  it('bloquea solo suspended y canceled', () => {
    expect(isTenantBlocked('suspended')).toBe(true)
    expect(isTenantBlocked('canceled')).toBe(true)
  })

  it('NO bloquea estados operativos ni desconocidos (fail-open)', () => {
    expect(isTenantBlocked('active')).toBe(false)
    expect(isTenantBlocked('trialing')).toBe(false)
    expect(isTenantBlocked('past_due')).toBe(false)
    expect(isTenantBlocked(null)).toBe(false)
    expect(isTenantBlocked(undefined)).toBe(false)
    expect(isTenantBlocked('otro')).toBe(false)
  })
})
