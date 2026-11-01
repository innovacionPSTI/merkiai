import { explodeComponents, bomUnitCost, isConsumptionPolicy, type BomComponent } from '../bom'

const comps: BomComponent[] = [
  { component_stock_item_id: 10, qty: 200, uom_id: 1, uom_factor: 1 },   // 200 g por unidad
  { component_stock_item_id: 11, qty: 1, uom_id: 2, uom_factor: 1 },     // 1 empaque por unidad
]

describe('BOM (HU-404, puro)', () => {
  it('explota escalando por outputQty/yield', () => {
    // yield 1 → producir 5 requiere 5× cada componente
    expect(explodeComponents(comps, 5, 1)).toEqual([
      { component_stock_item_id: 10, qty: 1000, uom_id: 1 },
      { component_stock_item_id: 11, qty: 5, uom_id: 2 },
    ])
  })

  it('yield > 1 reparte proporcionalmente', () => {
    // receta rinde 4; producir 2 → mitad de cada componente
    expect(explodeComponents(comps, 2, 4)).toEqual([
      { component_stock_item_id: 10, qty: 100, uom_id: 1 },
      { component_stock_item_id: 11, qty: 0.5, uom_id: 2 },
    ])
  })

  it('costo unitario = suma de componentes / yield (completo)', () => {
    // 200 g a 10 = 2000 ; 1 empaque a 300 = 300 ; yield 1 → 2300
    const cost = bomUnitCost(comps, 1, (id) => (id === 10 ? 10 : id === 11 ? 300 : null))
    expect(cost).toEqual({ cost: 2300, complete: true })
  })

  it('costo incompleto si falta el costo de un componente (suma lo conocido)', () => {
    const cost = bomUnitCost(comps, 1, (id) => (id === 10 ? 10 : null))
    expect(cost.complete).toBe(false)
    expect(cost.cost).toBe(2000)
  })

  it('isConsumptionPolicy', () => {
    expect(isConsumptionPolicy('al_vender')).toBe(true)
    expect(isConsumptionPolicy('al_producir')).toBe(true)
    expect(isConsumptionPolicy('otro')).toBe(false)
  })
})
