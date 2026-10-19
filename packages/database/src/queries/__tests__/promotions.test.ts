import { computePromotions, promotionAmount, isPromotionLive, validatePromotion } from '../promotions'
import type { Promotion, CartLine } from '../promotions'

function promo(over: Partial<Promotion>): Promotion {
  return {
    id: 1, name: 'P', type: 'cart_percent', config: {}, active: true,
    priority: 100, combinable: false, starts_at: null, ends_at: null, ...over,
  }
}

const lines: CartLine[] = [
  { variant_id: 1, product_id: 10, category_id: 5, qty: 2, price: 1000 }, // 2000
  { variant_id: 2, product_id: 20, category_id: 7, qty: 1, price: 3000 }, // 3000
]
const subtotal = 5000

describe('promotionAmount (HU-147)', () => {
  it('cart_percent respeta min_subtotal', () => {
    expect(promotionAmount(promo({ type: 'cart_percent', config: { percent: 10 } }), lines, subtotal)).toBe(500)
    expect(promotionAmount(promo({ type: 'cart_percent', config: { percent: 10, min_subtotal: 6000 } }), lines, subtotal)).toBe(0)
  })
  it('cart_fixed no supera el subtotal', () => {
    expect(promotionAmount(promo({ type: 'cart_fixed', config: { amount: 1500 } }), lines, subtotal)).toBe(1500)
    expect(promotionAmount(promo({ type: 'cart_fixed', config: { amount: 99999 } }), lines, subtotal)).toBe(5000)
  })
  it('category_percent solo descuenta la categoría objetivo', () => {
    expect(promotionAmount(promo({ type: 'category_percent', config: { category_id: 5, percent: 50 } }), lines, subtotal)).toBe(1000)
    expect(promotionAmount(promo({ type: 'category_percent', config: { category_id: 99, percent: 50 } }), lines, subtotal)).toBe(0)
  })
  it('bogo 1x1 por producto: 4 uds → 2 gratis', () => {
    const l: CartLine[] = [{ variant_id: 1, product_id: 10, category_id: 5, qty: 4, price: 1000 }]
    expect(promotionAmount(promo({ type: 'bogo', config: { product_id: 10, buy_qty: 1, get_qty: 1, percent: 100 } }), l, 4000)).toBe(2000)
  })
  it('bogo sin objetivo no aplica', () => {
    expect(promotionAmount(promo({ type: 'bogo', config: { buy_qty: 1, get_qty: 1 } }), lines, subtotal)).toBe(0)
  })
})

describe('isPromotionLive', () => {
  const now = new Date('2026-10-18T12:00:00Z')
  it('inactiva → false', () => { expect(isPromotionLive(promo({ active: false }), now)).toBe(false) })
  it('fuera de ventana → false', () => {
    expect(isPromotionLive(promo({ starts_at: '2026-10-19T00:00:00Z' }), now)).toBe(false)
    expect(isPromotionLive(promo({ ends_at: '2026-10-17T00:00:00Z' }), now)).toBe(false)
  })
  it('vigente → true', () => {
    expect(isPromotionLive(promo({ starts_at: '2026-10-01T00:00:00Z', ends_at: '2026-10-31T00:00:00Z' }), now)).toBe(true)
  })
})

describe('computePromotions', () => {
  it('sin promociones → 0', () => {
    expect(computePromotions(lines, [])).toEqual({ discount: 0, applied: [] })
  })
  it('exclusiva: gana la de mayor descuento (no acumula)', () => {
    const res = computePromotions(lines, [
      promo({ id: 1, name: '10%', type: 'cart_percent', config: { percent: 10 }, combinable: false }), // 500
      promo({ id: 2, name: 'fijo 1500', type: 'cart_fixed', config: { amount: 1500 }, combinable: false }), // 1500
    ])
    expect(res.discount).toBe(1500)
    expect(res.applied).toEqual([{ promotion_id: 2, name: 'fijo 1500', amount: 1500 }])
  })
  it('combinables se suman', () => {
    const res = computePromotions(lines, [
      promo({ id: 1, name: '10%', type: 'cart_percent', config: { percent: 10 }, combinable: true }),  // 500
      promo({ id: 2, name: 'cat 50%', type: 'category_percent', config: { category_id: 5, percent: 50 }, combinable: true }), // 1000
    ])
    expect(res.discount).toBe(1500)
    expect(res.applied).toHaveLength(2)
  })
  it('una exclusiva aplicable anula la combinación', () => {
    const res = computePromotions(lines, [
      promo({ id: 1, name: '10%', type: 'cart_percent', config: { percent: 10 }, combinable: true }),  // 500
      promo({ id: 2, name: 'fijo 1500', type: 'cart_fixed', config: { amount: 1500 }, combinable: false }), // 1500 excl
    ])
    expect(res.discount).toBe(1500)
    expect(res.applied).toEqual([{ promotion_id: 2, name: 'fijo 1500', amount: 1500 }])
  })
  it('el descuento nunca supera el subtotal (prorratea applied)', () => {
    const res = computePromotions(lines, [
      promo({ id: 1, name: 'a', type: 'cart_fixed', config: { amount: 4000 }, combinable: true }),
      promo({ id: 2, name: 'b', type: 'cart_fixed', config: { amount: 4000 }, combinable: true }),
    ])
    expect(res.discount).toBe(5000)
    expect(res.applied.reduce((s, a) => s + a.amount, 0)).toBe(5000)
  })
})

describe('validatePromotion', () => {
  it('rechaza porcentaje faltante', () => {
    expect(validatePromotion({ name: 'x', type: 'cart_percent', config: {} }).ok).toBe(false)
  })
  it('bogo requiere objetivo', () => {
    expect(validatePromotion({ name: 'x', type: 'bogo', config: { buy_qty: 1, get_qty: 1 } }).ok).toBe(false)
    expect(validatePromotion({ name: 'x', type: 'bogo', config: { product_id: 1, buy_qty: 1, get_qty: 1 } }).ok).toBe(true)
  })
})
