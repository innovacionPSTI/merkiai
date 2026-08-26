import { hasFeature, withinLimit, limitOf } from '../entitlements'
import type { PlanEntitlements } from '../entitlements'

const pro: PlanEntitlements = {
  features: { pos: true, custom_domain: true, ai: false },
  limits: { products: 2000, users: null },
}

describe('entitlements (HU-173)', () => {
  it('hasFeature refleja las features del plan', () => {
    expect(hasFeature(pro, 'pos')).toBe(true)
    expect(hasFeature(pro, 'ai')).toBe(false)
    expect(hasFeature(pro, 'inexistente')).toBe(false)
    expect(hasFeature(null, 'pos')).toBe(false)
  })

  it('withinLimit respeta límites y trata null como ilimitado', () => {
    expect(withinLimit(pro, 'products', 1999)).toBe(true)
    expect(withinLimit(pro, 'products', 2000)).toBe(false)
    expect(withinLimit(pro, 'users', 999999)).toBe(true) // null = ilimitado
    expect(withinLimit(pro, 'sin_limite', 5)).toBe(true)
  })

  it('limitOf devuelve el número o null', () => {
    expect(limitOf(pro, 'products')).toBe(2000)
    expect(limitOf(pro, 'users')).toBeNull()
    expect(limitOf(pro, 'x')).toBeNull()
  })
})
