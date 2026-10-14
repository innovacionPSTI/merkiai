import { getSalesReport, salesReportToCsv } from '../reports'

function dbWithOrders(rows: unknown[]) {
  const order = jest.fn().mockResolvedValue({ data: rows })
  const lt = jest.fn().mockReturnValue({ order })
  const gte = jest.fn().mockReturnValue({ lt })
  const select = jest.fn().mockReturnValue({ gte })
  return { db: { from: jest.fn(() => ({ select })) } as any, gte, lt }
}

describe('getSalesReport (HU-116)', () => {
  it('excluye cancelados; agrega ingresos, pedidos, ticket, por día y top productos', async () => {
    const rows = [
      { created_at: '2026-02-01T10:00:00Z', total: 10000, status: 'delivered',
        items: [{ product_id: 1, product_name: 'A', qty: 2, price: 3000 }, { product_id: 2, product_name: 'B', qty: 1, price: 4000 }] },
      { created_at: '2026-02-01T18:00:00Z', total: 6000, status: 'processing',
        items: [{ product_id: 1, product_name: 'A', qty: 1, price: 3000 }] },
      { created_at: '2026-02-02T09:00:00Z', total: 9999, status: 'cancelled',  // excluido
        items: [{ product_id: 1, product_name: 'A', qty: 5, price: 3000 }] },
      { created_at: '2026-02-02T12:00:00Z', total: 5000, status: 'shipped',
        items: [{ product_id: 3, product_name: 'C', qty: 1, price: 5000 }] },
    ]
    const { db, gte, lt } = dbWithOrders(rows)
    const r = await getSalesReport(db, { from: '2026-02-01', to: '2026-02-02' })

    expect(gte).toHaveBeenCalledWith('created_at', '2026-02-01T00:00:00.000Z')
    expect(lt).toHaveBeenCalledWith('created_at', '2026-02-03T00:00:00.000Z') // to+1 exclusivo
    expect(r.revenue).toBe(21000)      // 10000 + 6000 + 5000 (cancelado fuera)
    expect(r.orders).toBe(3)
    expect(r.avgTicket).toBe(7000)
    expect(r.byDay).toEqual([
      { date: '2026-02-01', revenue: 16000, orders: 2 },
      { date: '2026-02-02', revenue: 5000, orders: 1 },
    ])
    // Top por ingresos de ítem: A = (2+1)*3000 = 9000, B = 4000, C = 5000 → A, C, B
    expect(r.topProducts.map((p) => p.product_id)).toEqual([1, 3, 2])
    expect(r.topProducts[0]).toMatchObject({ product_id: 1, name: 'A', qty: 3, revenue: 9000 })
  })

  it('rango sin pedidos → ceros', async () => {
    const { db } = dbWithOrders([])
    const r = await getSalesReport(db, { from: '2026-03-01', to: '2026-03-31' })
    expect(r).toMatchObject({ revenue: 0, orders: 0, avgTicket: 0, byDay: [], topProducts: [] })
  })
})

describe('salesReportToCsv', () => {
  it('serializa el detalle diario con cabecera', () => {
    const csv = salesReportToCsv({
      from: '2026-02-01', to: '2026-02-02', revenue: 16000, orders: 2, avgTicket: 8000,
      byDay: [{ date: '2026-02-01', revenue: 16000, orders: 2 }], topProducts: [],
    })
    expect(csv.split('\n')[0]).toBe('fecha,pedidos,ingresos')
    expect(csv).toContain('2026-02-01,2,16000')
  })
})
