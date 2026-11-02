import { inventoryValuationToCsv, movementsSummaryToCsv, summarizeMovements, type InventoryValuationRow, type MovementLite } from '../operations-report'

describe('exportes CSV de operaciones (HU-409 AC-1, puros)', () => {
  it('inventoryValuationToCsv: encabezados + filas; costo nulo → vacío', () => {
    const rows: InventoryValuationRow[] = [
      { key: 'cafe', name: 'Café', item_class: 'materia_prima', available: 10, unit_cost: 100, value: 1000 },
      { key: 'leche', name: 'Leche', item_class: 'insumo', available: 5, unit_cost: null, value: 0 },
    ]
    const csv = inventoryValuationToCsv(rows)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('clave,nombre,clase,disponible,costo_unitario,valor')
    expect(lines[1]).toBe('cafe,Café,materia_prima,10,100,1000')
    expect(lines[2]).toBe('leche,Leche,insumo,5,,0') // costo vacío
  })

  it('movementsSummaryToCsv: una fila por tipo', () => {
    const movs: MovementLite[] = [
      { movement_type: 'purchase', qty_base: 100, unit_cost: 50 },
      { movement_type: 'waste', qty_base: -5 },
    ]
    const csv = movementsSummaryToCsv(summarizeMovements(movs))
    const lines = csv.split('\n')
    expect(lines[0]).toBe('tipo,movimientos,entradas,salidas,valor_entradas')
    expect(lines.some((l) => l.startsWith('purchase,1,100,0,5000'))).toBe(true)
    expect(lines.some((l) => l.startsWith('waste,1,0,5,0'))).toBe(true)
  })
})
