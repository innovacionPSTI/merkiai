/**
 * @jest-environment node
 *
 * Integration — /api/admin/reviews (HU-101 moderación)
 *   · PATCH cambia estado; valida entrada
 *   · DELETE elimina; valida id
 */
import { NextRequest } from 'next/server'

const updated: { id: number; row: any }[] = []
const deleted: number[] = []

const mockFrom = jest.fn(() => ({
  update: (row: any) => ({ eq: (_c: string, id: number) => { updated.push({ id, row }); return Promise.resolve({ error: null }) } }),
  delete: () => ({ eq: (_c: string, id: number) => { deleted.push(id); return Promise.resolve({ error: null }) } }),
  select: () => ({ order: () => Promise.resolve({ data: [] }) }),
}))

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { PATCH, DELETE } from '../route'

const patch = (body: any) =>
  PATCH(new NextRequest('http://localhost/api/admin/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as any)
const del = (qs: string) =>
  DELETE(new NextRequest(`http://localhost/api/admin/reviews?${qs}`, { method: 'DELETE' }) as any)

beforeEach(() => { updated.length = 0; deleted.length = 0; jest.clearAllMocks() })

describe('/api/admin/reviews', () => {
  it('PATCH aprueba una reseña', async () => {
    const res = await patch({ id: 5, status: 'approved' })
    expect(res.status).toBe(200)
    expect(updated[0]).toEqual({ id: 5, row: { status: 'approved' } })
  })
  it('PATCH rechaza estado inválido', async () => {
    const res = await patch({ id: 5, status: 'loquesea' })
    expect(res.status).toBe(400)
  })
  it('DELETE elimina por id', async () => {
    const res = await del('id=9')
    expect(res.status).toBe(200)
    expect(deleted).toEqual([9])
  })
  it('DELETE rechaza id inválido', async () => {
    const res = await del('id=abc')
    expect(res.status).toBe(400)
  })
})
