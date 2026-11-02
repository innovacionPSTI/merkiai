import { validateSelection, selectionPriceDelta, selectionConsumption, type ModifierOption } from '../modifiers'

const opts: ModifierOption[] = [
  { id: 1, group_id: 1, name: 'Extra queso', price_delta: 3000, consume_stock_item_id: 50, consume_qty: 30, consume_uom_id: 2, active: true, order_index: 0 },
  { id: 2, group_id: 1, name: 'Sin cebolla', price_delta: 0, consume_stock_item_id: null, consume_qty: null, consume_uom_id: null, active: true, order_index: 1 },
  { id: 3, group_id: 1, name: 'Doble carne', price_delta: 8000, consume_stock_item_id: 51, consume_qty: 150, consume_uom_id: 2, active: true, order_index: 2 },
]

describe('modificadores (HU-406, puros)', () => {
  it('validateSelection: required/min/max', () => {
    expect(validateSelection({ name: 'Punto', min_select: 0, max_select: 1, required: true }, 0)).toMatch(/Selecciona/)
    expect(validateSelection({ name: 'Adiciones', min_select: 0, max_select: 2, required: false }, 3)).toMatch(/máximo 2/)
    expect(validateSelection({ name: 'Adiciones', min_select: 0, max_select: 0, required: false }, 5)).toBeNull() // 0 = sin tope
    expect(validateSelection({ name: 'Adiciones', min_select: 1, max_select: 3, required: false }, 2)).toBeNull()
  })

  it('selectionPriceDelta suma los ajustes seleccionados', () => {
    expect(selectionPriceDelta(opts, [1, 3])).toBe(11000)
    expect(selectionPriceDelta(opts, [2])).toBe(0)
    expect(selectionPriceDelta(opts, [])).toBe(0)
  })

  it('selectionConsumption lista solo opciones con consumo, escalado por qty', () => {
    expect(selectionConsumption(opts, [1, 2, 3], 1)).toEqual([
      { stock_item_id: 50, qty: 30, uom_id: 2 },
      { stock_item_id: 51, qty: 150, uom_id: 2 },
    ])
    // dos unidades del plato → doble consumo
    expect(selectionConsumption(opts, [1], 2)).toEqual([{ stock_item_id: 50, qty: 60, uom_id: 2 }])
  })
})
