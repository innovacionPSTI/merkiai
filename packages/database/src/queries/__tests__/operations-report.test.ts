import { summarizeInventory, summarizeMovements, type MovementLite } from '../operations-report'

describe('reportes de operaciones (HU-409, puros)', () => {
  it('summarizeInventory: valor a costo por clase + sin costo', () => {
    const items = [
      { id: 1, item_class: 'materia_prima', sellable: false },
      { id: 2, item_class: 'materia_prima', sellable: false },
      { id: 3, item_class: 'terminado', sellable: true },
    ]
    const available = { 1: 10, 2: 5, 3: 4 }
    const cost = { 1: 100, 2: null, 3: 2000 } // ítem 2 tiene disponible pero sin costo
    const r = summarizeInventory(items, available, cost)
    expect(r.totalItems).toBe(3)
    expect(r.sellableItems).toBe(1)
    expect(r.withoutCost).toBe(1)
    // 10×100 + 5×0 + 4×2000 = 1000 + 8000 = 9000
    expect(r.totalValue).toBe(9000)
    const mp = r.byClass.find((c) => c.item_class === 'materia_prima')!
    expect(mp.count).toBe(2)
    expect(mp.value).toBe(1000)
    // ordenado por valor desc: terminado (8000) antes que materia_prima (1000)
    expect(r.byClass[0].item_class).toBe('terminado')
  })

  it('summarizeInventory: inventario vacío', () => {
    const r = summarizeInventory([], {}, {})
    expect(r).toMatchObject({ totalItems: 0, totalValue: 0, byClass: [] })
  })

  it('summarizeMovements: entradas/salidas y valor por tipo', () => {
    const movs: MovementLite[] = [
      { movement_type: 'purchase', qty_base: 100, unit_cost: 50 },
      { movement_type: 'purchase', qty_base: 40, unit_cost: 60 },
      { movement_type: 'production_consume', qty_base: -30 },
      { movement_type: 'waste', qty_base: -5 },
      { movement_type: 'purchase', qty_base: 10, unit_cost: null }, // sin costo → no suma valor
    ]
    const r = summarizeMovements(movs, '2026-10-01')
    expect(r.from).toBe('2026-10-01')
    expect(r.total).toBe(5)
    const purchase = r.byType.find((t) => t.movement_type === 'purchase')!
    expect(purchase.count).toBe(3)
    expect(purchase.qtyIn).toBe(150)
    expect(purchase.valueIn).toBe(100 * 50 + 40 * 60) // 5000 + 2400 = 7400
    const consume = r.byType.find((t) => t.movement_type === 'production_consume')!
    expect(consume.qtyOut).toBe(30)
    // ordenado por conteo desc → purchase primero
    expect(r.byType[0].movement_type).toBe('purchase')
  })
})
