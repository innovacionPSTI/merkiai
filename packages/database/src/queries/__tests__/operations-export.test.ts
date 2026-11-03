import { inventoryValuationToCsv, movementsSummaryToCsv, kardexToCsv, summarizeMovements, type InventoryValuationRow, type MovementLite, type KardexRow } from '../operations-report'

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

  it('kardexToCsv: encabezados + mapeo (unidad por código, referencia compuesta)', () => {
    const rows: KardexRow[] = [
      { created_at: '2026-11-01T10:00:00Z', movement_type: 'purchase', direction: 'in', qty: 100, uom_id: 2, reason: 'Compra', ref_type: 'order', ref_id: 'ORD-9' },
      { created_at: '2026-11-02T10:00:00Z', movement_type: 'sale', direction: 'out', qty: 5, uom_id: null, reason: null, ref_type: null, ref_id: null },
    ]
    const csv = kardexToCsv(rows, { 2: 'g' })
    const lines = csv.split('\n')
    expect(lines[0]).toBe('fecha,tipo,direccion,cantidad,unidad,motivo,referencia')
    expect(lines[1]).toBe('2026-11-01T10:00:00Z,purchase,in,100,g,Compra,order ORD-9')
    expect(lines[2]).toBe('2026-11-02T10:00:00Z,sale,out,5,,,')
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
