import { amountCoversOrder } from '../payment-guards'

describe('amountCoversOrder', () => {
  it('acepta pago exacto', () => {
    expect(amountCoversOrder(50000, 50000)).toBe(true)
  })
  it('acepta sobrepago', () => {
    expect(amountCoversOrder(60000, 50000)).toBe(true)
  })
  it('tolera 1 COP de redondeo', () => {
    expect(amountCoversOrder(49999.4, 50000)).toBe(true) // round → 49999, +1 = 50000
  })
  it('rechaza subpago claro', () => {
    expect(amountCoversOrder(40000, 50000)).toBe(false)
  })
  it('no bloquea cuando no hay dato de monto', () => {
    expect(amountCoversOrder(null, 50000)).toBe(true)
    expect(amountCoversOrder(undefined, 50000)).toBe(true)
    expect(amountCoversOrder(NaN, 50000)).toBe(true)
  })
})
