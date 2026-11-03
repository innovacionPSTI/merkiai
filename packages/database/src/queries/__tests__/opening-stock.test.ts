import { planOpeningMovements, type VariantStockLink } from '../opening-stock'

describe('backfill saldo de apertura (E18·HU-178 F3, plan puro)', () => {
  it('agrega stock por stock_item y omite ≤ 0', () => {
    const links: VariantStockLink[] = [
      { stock_item_id: 100, stock: 5, tenant_id: 't1' },
      { stock_item_id: 100, stock: 3, tenant_id: 't1' }, // mismo ítem → suma
      { stock_item_id: 200, stock: 0, tenant_id: 't1' }, // 0 → omite
      { stock_item_id: 300, stock: 12, tenant_id: 't1' },
    ]
    const plan = planOpeningMovements(links)
    const map = new Map(plan.map((m) => [m.stock_item_id, m.qty_base]))
    expect(map.get(100)).toBe(8)
    expect(map.has(200)).toBe(false)
    expect(map.get(300)).toBe(12)
    expect(plan.every((m) => m.tenant_id === 't1')).toBe(true)
  })

  it('sin enlaces → plan vacío', () => {
    expect(planOpeningMovements([])).toEqual([])
  })
})
