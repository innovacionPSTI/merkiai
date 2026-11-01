import { weightedAverageCost, inventoryValue } from '../costing'

describe('costeo (HU-403, puro)', () => {
  it('promedio ponderado por unidad base', () => {
    // 1000 g a 10 + 3000 g a 14 → (10000 + 42000) / 4000 = 13
    expect(weightedAverageCost([
      { qty_base: 1000, unit_cost: 10 },
      { qty_base: 3000, unit_cost: 14 },
    ])).toBe(13)
  })

  it('ignora salidas y movimientos sin costo', () => {
    expect(weightedAverageCost([
      { qty_base: 1000, unit_cost: 10 },
      { qty_base: -500, unit_cost: 10 },   // salida: no pesa
      { qty_base: 200, unit_cost: null },  // sin costo: no pesa
    ])).toBe(10)
  })

  it('null si no hay entradas con costo', () => {
    expect(weightedAverageCost([])).toBeNull()
    expect(weightedAverageCost([{ qty_base: -5, unit_cost: 3 }])).toBeNull()
    expect(weightedAverageCost([{ qty_base: 5, unit_cost: null }])).toBeNull()
  })

  it('inventoryValue = disponible × costo (0 si costo desconocido)', () => {
    expect(inventoryValue(2000, 13)).toBe(26000)
    expect(inventoryValue(2000, null)).toBe(0)
  })
})
