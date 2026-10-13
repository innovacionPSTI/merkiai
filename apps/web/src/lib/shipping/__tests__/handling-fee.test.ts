/**
 * Unit tests — applyHandlingFee (HU-280)
 * Cargo adicional (fijo + %) sobre tarifas de transportadora.
 */
import { applyHandlingFee } from '../index'
import type { ShippingRate } from '../types'

const rate = (total: number): ShippingRate => ({
  id: 'r', provider: 'skydropx', carrier_name: 'X', service_name: 'S', currency: 'COP', total_price: total, days: 2,
})

describe('applyHandlingFee', () => {
  it('sin cargo → devuelve las mismas tarifas', () => {
    const rates = [rate(10000)]
    expect(applyHandlingFee(rates, 0, 0)).toEqual(rates)
  })

  it('suma el monto fijo', () => {
    expect(applyHandlingFee([rate(10000)], 2000, 0)[0].total_price).toBe(12000)
  })

  it('aplica el porcentaje', () => {
    expect(applyHandlingFee([rate(10000)], 0, 10)[0].total_price).toBe(11000)
  })

  it('combina porcentaje y fijo (porcentaje primero, luego fijo)', () => {
    // 10000 * 1.10 = 11000, + 1500 = 12500
    expect(applyHandlingFee([rate(10000)], 1500, 10)[0].total_price).toBe(12500)
  })

  it('redondea e ignora negativos', () => {
    expect(applyHandlingFee([rate(9999)], -100, 7.5)[0].total_price).toBe(Math.round(9999 * 1.075))
  })
})
