import {
  hasFeature, withinLimit, limitOf,
  resolveFeature, resolveLimit, requireFeature, enforceLimit,
  EntitlementError, entitlementDef, ENTITLEMENTS_CATALOG, FEATURES, LIMITS,
  effectiveSectionsForRole,
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

describe('entitlements del Constructor v2 (HU-359)', () => {
  it('declara todas las features/limits del Constructor en el catálogo', () => {
    const keys = ENTITLEMENTS_CATALOG.map((e) => e.key)
    for (const k of [
      FEATURES.PAGE_BUILDER, FEATURES.LAYOUT_ADVANCED, FEATURES.PAGE_STYLE,
      FEATURES.COLLECTIONS, FEATURES.TEMPLATES_BY_TYPE, FEATURES.DYNAMIC_LIST,
      FEATURES.GLOBAL_PARTIALS, FEATURES.MEDIA_LIBRARY, FEATURES.SAVED_BLOCKS,
      LIMITS.MAX_PAGES, LIMITS.MAX_COLLECTIONS, LIMITS.MAX_COLLECTION_RECORDS, LIMITS.MAX_MEDIA_MB,
    ]) {
      expect(keys).toContain(k)
    }
  })

  it('defaults: layout y estilo por página ON; colecciones/medios OFF (cero regresión)', () => {
    const empty: PlanEntitlements = { features: {}, limits: {} }
    expect(resolveFeature(empty, FEATURES.LAYOUT_ADVANCED)).toBe(true)
    expect(resolveFeature(empty, FEATURES.PAGE_STYLE)).toBe(true)
    expect(resolveFeature(empty, FEATURES.COLLECTIONS)).toBe(false)
    expect(resolveFeature(empty, FEATURES.MEDIA_LIBRARY)).toBe(false)
    expect(resolveFeature(empty, FEATURES.PAGE_BUILDER)).toBe(false)
  })

  it('un plan puede apagar layout avanzado y encender colecciones', () => {
    const plan: PlanEntitlements = { features: { [FEATURES.LAYOUT_ADVANCED]: false, [FEATURES.COLLECTIONS]: true }, limits: {} }
    expect(resolveFeature(plan, FEATURES.LAYOUT_ADVANCED)).toBe(false)
    expect(resolveFeature(plan, FEATURES.COLLECTIONS)).toBe(true)
  })

  it('max_paginas default ilimitado; un plan puede fijarlo', () => {
    expect(resolveLimit({ features: {}, limits: {} }, LIMITS.MAX_PAGES)).toBeNull()
    expect(() => enforceLimit({ features: {}, limits: { [LIMITS.MAX_PAGES]: 3 } }, LIMITS.MAX_PAGES, 3)).toThrow(EntitlementError)
    expect(() => enforceLimit({ features: {}, limits: { [LIMITS.MAX_PAGES]: 3 } }, LIMITS.MAX_PAGES, 2)).not.toThrow()
  })
})

describe('effectiveSectionsForRole (HU-281)', () => {
  const DEF = ['dashboard', 'productos', 'pedidos', 'clientes', 'cupones']

  it('roles NO-staff ignoran la matriz (acceso completo del rol)', () => {
    expect(effectiveSectionsForRole('admin', DEF, { admin: ['dashboard'] })).toEqual(DEF)
    expect(effectiveSectionsForRole('super_admin', DEF, { super_admin: [] })).toEqual(DEF)
  })

  it('rol staff sin override usa los defaults', () => {
    expect(effectiveSectionsForRole('vendedor', DEF, {})).toEqual(DEF)
    expect(effectiveSectionsForRole('vendedor', DEF, undefined)).toEqual(DEF)
    expect(effectiveSectionsForRole('vendedor', DEF, { vendedor: [] })).toEqual(DEF)
  })

  it('rol staff con override recorta y valida secciones; garantiza dashboard', () => {
    expect(effectiveSectionsForRole('vendedor', DEF, { vendedor: ['productos', 'pedidos'] }))
      .toEqual(['dashboard', 'productos', 'pedidos'])
    // secciones desconocidas se descartan
    expect(effectiveSectionsForRole('vendedor', DEF, { vendedor: ['productos', 'inexistente'] }))
      .toEqual(['dashboard', 'productos'])
  })

  it('rol staff con override puede AMPLIAR más allá del default', () => {
    expect(effectiveSectionsForRole('gestor_tienda', DEF, { gestor_tienda: ['contenido', 'configuracion'] }))
      .toEqual(['dashboard', 'contenido', 'configuracion'])
  })
})
