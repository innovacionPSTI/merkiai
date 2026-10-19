import { bundleMaxQty, isBundleAvailable, componentsListPrice, bundleSavings, validateBundle, expandBundleLines } from '../bundles'
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

  describe('expandBundleLines', () => {
    const bundles = new Map([[7, { name: 'Kit', price: 4000, components: [{ variant_id: 10, qty: 1 }, { variant_id: 20, qty: 2 }] }]])
    const prices = new Map([[10, 1000], [20, 2000]]) // list = 1000 + 2*2000 = 5000

    it('expande el bundle a componentes con stock por cantidad y precio distribuido', () => {
      const out = expandBundleLines([{ bundle_id: 7, qty: 2 }], bundles, prices)
      // comp10: qty 1*2=2 ; comp20: qty 2*2=4
      expect(out.map((o) => [o.variant_id, o.qty])).toEqual([[10, 2], [20, 4]])
      // precio del bundle (×1) distribuido: 4000*1000/5000=800 ; resto 3200 al último (÷qty2=1600)
      const perBundle = out[0].price * 1 + out[1].price * 2
      expect(perBundle).toBe(4000)
    })
    it('deja pasar las líneas normales sin tocar', () => {
      const out = expandBundleLines([{ variant_id: 99, qty: 1, price: 1500, product_name: 'X' }], bundles, prices)
      expect(out).toEqual([{ variant_id: 99, qty: 1, price: 1500, product_name: 'X', variant_label: '' }])
    })
    it('ignora un bundle desconocido', () => {
      expect(expandBundleLines([{ bundle_id: 999, qty: 1 }], bundles, prices)).toEqual([])
    })
  })
})
