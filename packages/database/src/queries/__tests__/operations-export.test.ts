import { inventoryValuationToCsv, movementsSummaryToCsv, kardexToCsv, purchasesToCsv, productionOrdersToCsv, summarizeMovements, type InventoryValuationRow, type MovementLite, type KardexRow, type PurchaseRow, type ProductionOrderRow } from '../operations-report'

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

  it('purchasesToCsv: proveedor por nombre; sin proveedor → vacío', () => {
    const rows: PurchaseRow[] = [
      { id: 1, reference: 'FAC-1', status: 'received', supplier_id: 7, received_at: '2026-11-01' },
      { id: 2, reference: null, status: 'draft', supplier_id: null, received_at: null },
    ]
    const csv = purchasesToCsv(rows, { 7: 'Proveedor X' }).split('\n')
    expect(csv[0]).toBe('id,referencia,estado,proveedor,recibida_en')
    expect(csv[1]).toBe('1,FAC-1,received,Proveedor X,2026-11-01')
    expect(csv[2]).toBe('2,,draft,,')
  })

  it('productionOrdersToCsv: producto por nombre', () => {
    const rows: ProductionOrderRow[] = [
      { id: 10, output_stock_item_id: 5, planned_qty: 20, produced_qty: 18, status: 'completed', completed_at: '2026-11-02' },
    ]
    const csv = productionOrdersToCsv(rows, { 5: 'Terminado A' }).split('\n')
    expect(csv[0]).toBe('id,producto,planificado,producido,estado,completada_en')
    expect(csv[1]).toBe('10,Terminado A,20,18,completed,2026-11-02')
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
