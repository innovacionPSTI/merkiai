/**
 * @jest-environment node
 *
 * Integration — POST /api/admin/blog/import (HU-132)
 *   · crea posts; omite/actualiza por slug; preview no escribe
 */
import { NextRequest } from 'next/server'

let existing: any[] = []
const inserted: any[] = []
const updated: { id: number; row: any }[] = []

const blogTable = () => ({
  select: jest.fn(() => Promise.resolve({ data: existing })),
  insert: jest.fn((row: any) => { inserted.push(row); return Promise.resolve({ error: null }) }),
  update: jest.fn((row: any) => ({ eq: (_c: string, id: number) => { updated.push({ id, row }); return Promise.resolve({ error: null }) } })),
})
const mockFrom = jest.fn(() => blogTable())

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: mockFrom }) }))

import { POST } from '../import/route'

const post = (body: any) =>
  POST(new NextRequest('http://localhost/api/admin/blog/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as any)

beforeEach(() => { existing = []; inserted.length = 0; updated.length = 0; jest.clearAllMocks() })

const csv = ['slug,title,published', 'hola,Hola,true', 'guia,Guía,false'].join('\n')

describe('POST /api/admin/blog/import', () => {
  it('crea posts nuevos', async () => {
    const res = await post({ csv })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.created).toBe(2)
    expect(inserted[0]).toMatchObject({ slug: 'hola', title: 'Hola', published: true, tenant_id: 't1' })
    expect(inserted[0].published_at).toBeTruthy()   // publicado sin fecha → fecha actual
  })

  it('create omite slugs existentes', async () => {
    existing = [{ id: 3, slug: 'hola' }]
    const res = await post({ csv })
    const data = await res.json()
    expect(data.created).toBe(1)
    expect(data.skipped.some((s: any) => s.slug === 'hola')).toBe(true)
  })

  it('upsert actualiza existente', async () => {
    existing = [{ id: 3, slug: 'hola' }]
    const res = await post({ csv: 'slug,title\nhola,Hola v2', mode: 'upsert' })
    const data = await res.json()
    expect(data.updated).toBe(1)
    expect(updated[0]).toMatchObject({ id: 3, row: { title: 'Hola v2' } })
  })

  it('preview no escribe', async () => {
    const res = await post({ csv, preview: true })
    const data = await res.json()
    expect(data.preview).toBe(true)
    expect(inserted).toHaveLength(0)
  })
})
