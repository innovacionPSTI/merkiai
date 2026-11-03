import { evaluateInventoryAlerts, evaluateInventoryAlertsByLocation } from '../operations-alerts'

const items = [
  { id: 1, key: 'cafe', name: 'Café', reorder_point: 1000 },   // bajo
  { id: 2, key: 'leche', name: 'Leche', reorder_point: 500 },  // agotado
  { id: 3, key: 'azucar', name: 'Azúcar', reorder_point: 200 },// ok
  { id: 4, key: 'vaso', name: 'Vaso', reorder_point: null },   // sin umbral → nunca alerta
  { id: 5, key: 'tapa', name: 'Tapa', reorder_point: 50, active: false }, // inactivo → ignora
]
const available = { 1: 800, 2: 0, 3: 900, 4: 0, 5: 0 }

describe('alertas de operaciones (HU-409 F2a, puras)', () => {
  it('emite bajo/agotado solo para ítems con reorder_point y disponible ≤ umbral', () => {
    const alerts = evaluateInventoryAlerts(items, available)
    const ids = alerts.map((a) => a.stock_item_id)
    expect(ids).toContain(1)
    expect(ids).toContain(2)
    expect(ids).not.toContain(3) // disponible > umbral
    expect(ids).not.toContain(4) // sin umbral
    expect(ids).not.toContain(5) // inactivo
  })

  it('clasifica agotado como critical y bajo como warning; critical primero', () => {
    const alerts = evaluateInventoryAlerts(items, available)
    expect(alerts[0].stock_item_id).toBe(2)
    expect(alerts[0]).toMatchObject({ kind: 'out_of_stock', severity: 'critical' })
    const cafe = alerts.find((a) => a.stock_item_id === 1)!
    expect(cafe).toMatchObject({ kind: 'low_stock', severity: 'warning', available: 800, reorder_point: 1000 })
  })

  it('sin disponible registrado → 0 (agotado)', () => {
    const alerts = evaluateInventoryAlerts([{ id: 9, key: 'x', name: 'X', reorder_point: 10 }], {})
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ kind: 'out_of_stock', available: 0 })
  })

  it('por ubicación: alerta cada sede bajo el mínimo del ítem (HU-183)', () => {
    const items2 = [{ id: 1, key: 'cafe', name: 'Café', reorder_point: 100 }]
    const byLoc = { 1: [
      { location_id: 10, available: 50 },  // bajo
      { location_id: 11, available: 0 },   // agotado
      { location_id: 12, available: 300 }, // ok → sin alerta
    ] }
    const alerts = evaluateInventoryAlertsByLocation(items2, byLoc)
    expect(alerts.map((a) => a.location_id)).toEqual([11, 10]) // crítico primero
    expect(alerts[0]).toMatchObject({ kind: 'out_of_stock', location_id: 11 })
    expect(alerts[1]).toMatchObject({ kind: 'low_stock', location_id: 10, available: 50 })
  })
})
