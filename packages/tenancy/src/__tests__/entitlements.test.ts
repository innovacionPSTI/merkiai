import {
  hasFeature, withinLimit, limitOf,
  resolveFeature, resolveLimit, requireFeature, enforceLimit,
  EntitlementError, entitlementDef, ENTITLEMENTS_CATALOG, FEATURES, LIMITS,
} from '../entitlements'
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

describe('catálogo canónico de entitlements (HU-239)', () => {
  it('el catálogo declara todas las claves de FEATURES y LIMITS', () => {
    const keys = ENTITLEMENTS_CATALOG.map((e) => e.key)
    for (const k of [...Object.values(FEATURES), ...Object.values(LIMITS)]) {
      expect(keys).toContain(k)
      expect(entitlementDef(k)).toBeDefined()
    }
  })

  it('resolveFeature usa el default del catálogo cuando el plan no lo declara', () => {
    const empty: PlanEntitlements = { features: {}, limits: {} }
    expect(resolveFeature(empty, FEATURES.AI_DESIGN)).toBe(false) // default false
    expect(resolveFeature({ features: { [FEATURES.AI_DESIGN]: true }, limits: {} }, FEATURES.AI_DESIGN)).toBe(true)
  })

  it('resolveLimit: valor del plan o default (null = ilimitado)', () => {
    expect(resolveLimit({ features: {}, limits: { [LIMITS.PRODUCTS]: 50 } }, LIMITS.PRODUCTS)).toBe(50)
    expect(resolveLimit({ features: {}, limits: {} }, LIMITS.PRODUCTS)).toBeNull() // default null
  })

  it('requireFeature lanza EntitlementError si el plan no la habilita', () => {
    const empty: PlanEntitlements = { features: {}, limits: {} }
    expect(() => requireFeature(empty, FEATURES.MULTI_LOCATION)).toThrow(EntitlementError)
    expect(() => requireFeature({ features: { [FEATURES.MULTI_LOCATION]: true }, limits: {} }, FEATURES.MULTI_LOCATION)).not.toThrow()
  })

  it('enforceLimit lanza al alcanzar/superar el límite; permite bajo el límite e ilimitado', () => {
    const plan: PlanEntitlements = { features: {}, limits: { [LIMITS.PRODUCTS]: 2 } }
    expect(() => enforceLimit(plan, LIMITS.PRODUCTS, 1)).not.toThrow()
    expect(() => enforceLimit(plan, LIMITS.PRODUCTS, 2)).toThrow(EntitlementError)
    expect(() => enforceLimit({ features: {}, limits: {} }, LIMITS.PRODUCTS, 9999)).not.toThrow() // default null = ilimitado
  })

  it('EntitlementError lleva kind/key/code para el borde API', () => {
    try {
      enforceLimit({ features: {}, limits: { [LIMITS.PRODUCTS]: 0 } }, LIMITS.PRODUCTS, 0)
    } catch (e) {
      expect(e).toBeInstanceOf(EntitlementError)
      const err = e as EntitlementError
      expect(err.kind).toBe('limit')
      expect(err.key).toBe(LIMITS.PRODUCTS)
      expect(err.code).toBe('ENTITLEMENT')
      expect(err.meta).toMatchObject({ limit: 0, current: 0 })
    }
  })
})
