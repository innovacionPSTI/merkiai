/**
 * @jest-environment node
 *
 * Integration — GET /api/admin/backup (HU-125)
 *   · dominio inválido → 400
 *   · orders CSV: header + fila con dirección aplanada
 *   · customers JSON: descarga application/json
 */
import { NextRequest } from 'next/server'

const ordersData = [{
  order_number: 'ORD-1', created_at: '2026-01-01', status: 'pending', payment_status: 'approved',
  payment_method: 'wompi', customer_name: 'Ana', customer_email: 'a@x.com', customer_phone: '300',
  shipping_addr: { department: 'Valle', city: 'Cali', address: 'Cra 1' },
  subtotal: 1000, shipping_cost: 100, discount: 0, total: 1100, coupon_code: null,
  tracking_number: null, carrier_name: null, items: [{ sku: 'A', qty: 2 }],
}]
const customersData = [{ id: 'c1', name: 'Ana', email: 'a@x.com', phone: '300', created_at: '2026-01-01' }]

const mockFrom = jest.fn((table: string) => ({
  select: () => ({ order: () => Promise.resolve({ data: table === 'orders' ? ordersData : customersData }) }),
}))

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { GET } from '../route'

function get(qs: string) {
  return GET(new NextRequest(`http://localhost/api/admin/backup?${qs}`) as any)
}

describe('GET /api/admin/backup', () => {
  it('dominio inválido → 400', async () => {
    const res = await get('domain=foo')
    expect(res.status).toBe(400)
  })

  it('orders CSV: header + dirección aplanada', async () => {
    const res = await get('domain=orders&format=csv')
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    const text = await res.text()
    const [header, row] = text.split('\n')
    expect(header).toContain('shipping_city')
    expect(header).toContain('order_number')
    expect(row).toContain('Cali')     // ciudad aplanada desde shipping_addr
    expect(row).toContain('ORD-1')
  })

  it('customers JSON: descarga application/json', async () => {
    const res = await get('domain=customers&format=json')
    expect(res.headers.get('Content-Type')).toContain('application/json')
    const data = JSON.parse(await res.text())
    expect(data[0]).toMatchObject({ email: 'a@x.com' })
  })
})
