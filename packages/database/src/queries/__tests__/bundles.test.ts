import { bundleMaxQty, isBundleAvailable, componentsListPrice, bundleSavings, validateBundle } from '../bundles'
import type { BundleComponent } from '../bundles'

const comps = (over: Partial<BundleComponent>[] = []): BundleComponent[] =>
  over.map((o, i) => ({ variant_id: i + 1, qty: 1, stock: 10, allow_backorder: false, price: 1000, ...o }))

describe('bundles (HU-168)', () => {
  describe('bundleMaxQty', () => {
    it('limita por el componente más restrictivo', () => {
      expect(bundleMaxQty(comps([{ stock: 10, qty: 1 }, { stock: 4, qty: 2 }]))).toBe(2) // 10/1=10, 4/2=2
    })
    it('un componente con backorder no limita', () => {
      expect(bundleMaxQty(comps([{ stock: 0, allow_backorder: true, qty: 1 }, { stock: 6, qty: 2 }]))).toBe(3)
    })
    it('sin stock suficiente → 0', () => {
      expect(bundleMaxQty(comps([{ stock: 0, qty: 1 }]))).toBe(0)
    })
    it('sin componentes → 0', () => {
      expect(bundleMaxQty([])).toBe(0)
    })
  })

  describe('isBundleAvailable', () => {
    it('true si se puede armar al menos 1', () => {
      expect(isBundleAvailable(comps([{ stock: 1, qty: 1 }]))).toBe(true)
      expect(isBundleAvailable(comps([{ stock: 0, qty: 1 }]))).toBe(false)
    })
  })

  describe('pricing', () => {
    it('componentsListPrice suma precio*qty', () => {
      expect(componentsListPrice(comps([{ price: 1000, qty: 2 }, { price: 3000, qty: 1 }]))).toBe(5000)
    })
    it('bundleSavings nunca es negativo', () => {
      const c = comps([{ price: 1000, qty: 2 }, { price: 3000, qty: 1 }]) // list 5000
      expect(bundleSavings(4000, c)).toBe(1000)
      expect(bundleSavings(9000, c)).toBe(0)
    })
  })

  describe('validateBundle', () => {
    const ok = { name: 'Kit', slug: 'kit', price: 4000, components: [{ variant_id: 1, qty: 1 }] }
    it('acepta uno válido', () => { expect(validateBundle(ok).ok).toBe(true) })
    it('rechaza sin componentes', () => { expect(validateBundle({ ...ok, components: [] }).ok).toBe(false) })
    it('rechaza qty < 1', () => { expect(validateBundle({ ...ok, components: [{ variant_id: 1, qty: 0 }] }).ok).toBe(false) })
  })
})
