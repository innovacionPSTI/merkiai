import { purchaseLineTotal, purchaseTotal, costPerBase } from '../procurement'

describe('procurement (HU-402, puros)', () => {
  it('purchaseLineTotal = qty × costo', () => {
    expect(purchaseLineTotal(3, 59900)).toBe(179700)
    expect(purchaseLineTotal(2.5, 1000)).toBe(2500)
  })

  it('purchaseTotal suma líneas', () => {
    expect(purchaseTotal([{ qty: 2, unit_cost: 1000 }, { qty: 1.5, unit_cost: 2000 }])).toBe(5000)
    expect(purchaseTotal([])).toBe(0)
  })

  it('costPerBase convierte el costo a la unidad base', () => {
    // 1 kg a 10000 con factor 1000 → costo por gramo = 10
    expect(costPerBase(10000, 1000)).toBe(10)
    // unidad (factor 1) → igual
    expect(costPerBase(500, 1)).toBe(500)
    // factor inválido → devuelve el costo tal cual (fail-safe)
    expect(costPerBase(500, 0)).toBe(500)
  })
})
