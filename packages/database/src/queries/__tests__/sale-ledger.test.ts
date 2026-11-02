import { planSaleMovements, type SaleLine, type VariantConsumption } from '../sale-ledger'

const lines: SaleLine[] = [
  { variant_id: 10, qty: 2 },   // terminado stocked
  { variant_id: 20, qty: 3 },   // al_vender (consume componentes)
  { variant_id: 30, qty: 1 },   // sin enlace → se omite
  { variant_id: 40, qty: 0 },   // qty 0 → se omite
]

const consumptions: VariantConsumption[] = [
  { variant_id: 10, finished_stock_item_id: 100 },
  { variant_id: 20, components: [{ stock_item_id: 200, qty_base: 18 }, { stock_item_id: 201, qty_base: 150 }] },
  // variante 30: no aparece → sin consumo
]

describe('venta → ledger (E18·HU-178, plan puro)', () => {
  it('descuenta terminado directo y componentes al_vender escalados', () => {
    const plan = planSaleMovements(lines, consumptions)
    const map = new Map(plan.map((m) => [m.stock_item_id, m.qty_base]))
    expect(map.get(100)).toBe(2)        // 2 × terminado
    expect(map.get(200)).toBe(54)       // 3 × 18
    expect(map.get(201)).toBe(450)      // 3 × 150
    expect(map.size).toBe(3)            // variante 30/40 no generan movimiento
  })

  it('agrega por ítem cuando varias líneas tocan el mismo stock_item', () => {
    const l: SaleLine[] = [{ variant_id: 1, qty: 2 }, { variant_id: 2, qty: 5 }]
    const c: VariantConsumption[] = [
      { variant_id: 1, finished_stock_item_id: 500 },
      { variant_id: 2, finished_stock_item_id: 500 },
    ]
    expect(planSaleMovements(l, c)).toEqual([{ stock_item_id: 500, qty_base: 7 }])
  })

  it('sin consumos → plan vacío (cero regresión para catálogo-solo)', () => {
    expect(planSaleMovements(lines, [])).toEqual([])
  })
})
