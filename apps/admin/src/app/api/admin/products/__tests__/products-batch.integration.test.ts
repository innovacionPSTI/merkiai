/**
 * @jest-environment node
 *
 * Integration — POST /api/admin/products/batch (HU-131)
 *   · publicar/despublicar/destacar → update con .in(ids)
 *   · set_category → actualiza category_id
 *   · delete → borra variantes primero y luego productos
 *   · validación: sin ids → 400
 */
import { NextRequest } from 'next/server'

const calls: any[] = []

function updateChain(table: string) {
  return {
    update: (row: any) => ({ in: (col: string, ids: number[]) => { calls.push({ table, op: 'update', row, col, ids }); return Promise.resolve({ error: null }) } }),
    delete: () => ({ in: (col: string, ids: number[]) => { calls.push({ table, op: 'delete', col, ids }); return Promise.resolve({ error: null }) } }),
  }
}
const mockFrom = jest.fn((table: string) => updateChain(table))

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { POST } from '../batch/route'

function post(body: any) {
  return POST(new NextRequest('http://localhost/api/admin/products/batch', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as any)
}

beforeEach(() => { calls.length = 0; jest.clearAllMocks() })

describe('POST /api/admin/products/batch', () => {
  it('activate → products.update({active:true}).in(ids)', async () => {
    const res = await post({ ids: [1, 2], action: 'activate' })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ ok: true, affected: 2, action: 'activate' })
    expect(calls[0]).toMatchObject({ table: 'products', op: 'update', row: { active: true }, ids: [1, 2] })
  })

  it('unfeature → featured:false', async () => {
    await post({ ids: [5], action: 'unfeature' })
    expect(calls[0].row).toEqual({ featured: false })
  })

  it('set_category → category_id numérico', async () => {
    await post({ ids: [3], action: 'set_category', category_id: 7 })
    expect(calls[0].row).toEqual({ category_id: 7 })
  })

  it('set_category sin categoría → null', async () => {
    await post({ ids: [3], action: 'set_category', category_id: '' })
    expect(calls[0].row).toEqual({ category_id: null })
  })

  it('delete → borra variantes y luego productos', async () => {
    await post({ ids: [9, 10], action: 'delete' })
    expect(calls[0]).toMatchObject({ table: 'product_variants', op: 'delete', col: 'product_id', ids: [9, 10] })
    expect(calls[1]).toMatchObject({ table: 'products', op: 'delete', col: 'id', ids: [9, 10] })
  })

  it('sin ids → 400', async () => {
    const res = await post({ ids: [], action: 'activate' })
    expect(res.status).toBe(400)
  })

  it('acción desconocida → 400', async () => {
    const res = await post({ ids: [1], action: 'nope' })
    expect(res.status).toBe(400)
  })
})
