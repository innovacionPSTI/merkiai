import { buildMovementRow, defaultDirection, isMovementType } from '../stock-movements'

describe('buildMovementRow (HU-401, puro)', () => {
  it('entrada: qty_base positivo en unidad base', () => {
    const r = buildMovementRow({ stock_item_id: 1, movement_type: 'purchase', qty: 2, uom_factor: 1000 })
    expect(r).toMatchObject({ direction: 'in', qty: 2, qty_base: 2000, movement_type: 'purchase' })
  })

  it('salida: qty_base negativo', () => {
    const r = buildMovementRow({ stock_item_id: 1, movement_type: 'sale', qty: 3 })
    expect(r.direction).toBe('out')
    expect(r.qty_base).toBe(-3)
  })

  it('consumo de producción es salida (negativo)', () => {
    const r = buildMovementRow({ stock_item_id: 1, movement_type: 'production_consume', qty: 20, uom_factor: 1000 })
    expect(r.qty_base).toBe(-20000)
  })

  it('adjustment/transfer exigen direction explícita', () => {
    expect(() => buildMovementRow({ stock_item_id: 1, movement_type: 'adjustment', qty: 5 })).toThrow(/direction/)
    const up = buildMovementRow({ stock_item_id: 1, movement_type: 'adjustment', direction: 'in', qty: 5 })
    expect(up.qty_base).toBe(5)
    const down = buildMovementRow({ stock_item_id: 1, movement_type: 'adjustment', direction: 'out', qty: 5 })
    expect(down.qty_base).toBe(-5)
  })

  it('rechaza qty no positiva y tipo inválido', () => {
    expect(() => buildMovementRow({ stock_item_id: 1, movement_type: 'sale', qty: 0 })).toThrow(/qty/)
    // @ts-expect-error tipo inválido a propósito
    expect(() => buildMovementRow({ stock_item_id: 1, movement_type: 'x', qty: 1 })).toThrow(/tipo/)
  })

  it('propaga referencia, motivo, op_key y ubicación', () => {
    const r = buildMovementRow({ stock_item_id: 7, movement_type: 'sale', qty: 1, location_id: 3, ref_type: 'order', ref_id: 'ORD-1', reason: 'venta', op_key: 'order:ORD-1:7' })
    expect(r).toMatchObject({ location_id: 3, ref_type: 'order', ref_id: 'ORD-1', reason: 'venta', op_key: 'order:ORD-1:7' })
  })
})

describe('defaultDirection / isMovementType', () => {
  it('direcciones naturales', () => {
    expect(defaultDirection('purchase')).toBe('in')
    expect(defaultDirection('return')).toBe('in')
    expect(defaultDirection('waste')).toBe('out')
    expect(defaultDirection('adjustment')).toBeNull()
    expect(defaultDirection('transfer')).toBeNull()
  })
  it('isMovementType', () => {
    expect(isMovementType('sale')).toBe(true)
    expect(isMovementType('nope')).toBe(false)
  })
})
