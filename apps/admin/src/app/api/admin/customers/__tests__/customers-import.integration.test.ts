/**
 * @jest-environment node
 *
 * Integration — POST /api/admin/customers/import (HU-132)
 *   · crea clientes nuevos (insert en lote); omite/actualiza por email
 *   · preview no escribe
 */
import { NextRequest } from 'next/server'

let existing: any[] = []
const inserted: any[] = []
const updated: { id: string; row: any }[] = []

const customersTable = () => ({
  select: jest.fn(() => Promise.resolve({ data: existing })),
  insert: jest.fn((rows: any[]) => { inserted.push(...rows); return Promise.resolve({ error: null }) }),
  update: jest.fn((row: any) => ({ eq: (_c: string, id: string) => { updated.push({ id, row }); return Promise.resolve({ error: null }) } })),
})
const mockFrom = jest.fn(() => customersTable())

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { POST } from '../import/route'

const post = (body: any) =>
  POST(new NextRequest('http://localhost/api/admin/customers/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as any)

beforeEach(() => { existing = []; inserted.length = 0; updated.length = 0; jest.clearAllMocks() })

const csv = ['email,name,phone', 'ana@x.com,Ana,300', 'beto@x.com,Beto,'].join('\n')

describe('POST /api/admin/customers/import', () => {
  it('crea clientes nuevos en lote', async () => {
    const res = await post({ csv })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.created).toBe(2)
    expect(inserted).toHaveLength(2)
    expect(inserted[0]).toMatchObject({ email: 'ana@x.com', name: 'Ana', tenant_id: 't1' })
  })

  it('create omite emails existentes', async () => {
    existing = [{ id: 'u1', email: 'ana@x.com' }]
    const res = await post({ csv })
    const data = await res.json()
    expect(data.created).toBe(1)        // solo beto
    expect(data.skipped.some((s: any) => s.slug === 'ana@x.com')).toBe(true)
  })

  it('upsert actualiza el existente', async () => {
    existing = [{ id: 'u1', email: 'ana@x.com' }]
    const res = await post({ csv: 'email,name\nana@x.com,Ana Nueva', mode: 'upsert' })
    const data = await res.json()
    expect(data.updated).toBe(1)
    expect(updated[0]).toMatchObject({ id: 'u1', row: { name: 'Ana Nueva' } })
  })

  it('preview no escribe', async () => {
    const res = await post({ csv, preview: true })
    const data = await res.json()
    expect(data.preview).toBe(true)
    expect(inserted).toHaveLength(0)
  })
})
