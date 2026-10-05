/**
 * @jest-environment node
 *
 * Integration — POST /api/admin/categories/import (HU-132)
 *   · crea categorías y resuelve parent_slug → parent_id (2ª pasada)
 *   · upsert actualiza existentes; create las omite
 *   · preview no escribe
 */
import { NextRequest } from 'next/server'

let existing: { id: number; slug: string }[] = []
const inserted: any[] = []
const updated: { id: number; row: any }[] = []
let nextId = 100

const categoriesTable = () => ({
  select: jest.fn(() => Promise.resolve({ data: existing })),
  insert: jest.fn((row: any) => ({
    select: () => ({ single: () => { const rec = { id: nextId++, ...row }; inserted.push(rec); return Promise.resolve({ data: rec, error: null }) } }),
  })),
  update: jest.fn((row: any) => ({ eq: (_c: string, id: number) => { updated.push({ id, row }); return Promise.resolve({ error: null }) } })),
})
const mockFrom = jest.fn(() => categoriesTable())

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { POST } from '../import/route'

const post = (body: any) =>
  POST(new NextRequest('http://localhost/api/admin/categories/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as any)

beforeEach(() => { existing = []; inserted.length = 0; updated.length = 0; nextId = 100; jest.clearAllMocks() })

describe('POST /api/admin/categories/import', () => {
  const csv = ['slug,name,parent_slug', 'ropa,Ropa,', 'camisetas,Camisetas,ropa'].join('\n')

  it('crea y resuelve la jerarquía por parent_slug', async () => {
    const res = await post({ csv })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.created).toBe(2)
    // 2ª pasada: camisetas recibe parent_id = id de ropa (100)
    const parentUpdate = updated.find((u) => u.row.parent_id === 100)
    expect(parentUpdate).toBeTruthy()
  })

  it('upsert actualiza una categoría existente', async () => {
    existing = [{ id: 5, slug: 'ropa' }]
    const res = await post({ csv: 'slug,name\nropa,Ropa nueva', mode: 'upsert' })
    const data = await res.json()
    expect(data.updated).toBe(1)
    expect(data.created).toBe(0)
    expect(updated.some((u) => u.id === 5 && u.row.name === 'Ropa nueva')).toBe(true)
  })

  it('create omite existentes', async () => {
    existing = [{ id: 5, slug: 'ropa' }]
    const res = await post({ csv: 'slug,name\nropa,Ropa' })
    const data = await res.json()
    expect(data.created).toBe(0)
    expect(data.skipped.some((s: any) => s.slug === 'ropa')).toBe(true)
  })

  it('preview no escribe', async () => {
    const res = await post({ csv, preview: true })
    const data = await res.json()
    expect(data.preview).toBe(true)
    expect(inserted).toHaveLength(0)
  })
})
