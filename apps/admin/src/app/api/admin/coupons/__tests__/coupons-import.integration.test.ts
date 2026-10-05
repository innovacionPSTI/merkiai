/**
 * @jest-environment node
 *
 * Integration — POST /api/admin/coupons/import (HU-132)
 *   · crea cupones; omite/actualiza existentes por `code`
 *   · preview no escribe
 */
import { NextRequest } from 'next/server'

let existing: any[] = []
const created: any[] = []
const updated: { id: number; input: any }[] = []

jest.mock('@merkiai/database', () => {
  const actual = jest.requireActual('@merkiai/database')
  return {
    ...actual,
    getCoupons: jest.fn(async () => existing),
    createCoupon: jest.fn(async (input: any) => { created.push(input); return { id: 1, ...input } }),
    updateCoupon: jest.fn(async (id: number, input: any) => { updated.push({ id, input }); return { id, ...input } }),
  }
})

jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ role: 'admin', tenantId: 't1' })) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({}) }))

import { POST } from '../import/route'

const post = (body: any) =>
  POST(new NextRequest('http://localhost/api/admin/coupons/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as any)

beforeEach(() => { existing = []; created.length = 0; updated.length = 0; jest.clearAllMocks() })

const csv = ['code,type,value', 'bienvenida,percentage,10', 'envio,fixed,15000'].join('\n')

describe('POST /api/admin/coupons/import', () => {
  it('crea cupones nuevos (código en mayúsculas)', async () => {
    const res = await post({ csv })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.created).toBe(2)
    expect(created[0]).toMatchObject({ code: 'BIENVENIDA', type: 'percentage', value: 10 })
  })

  it('create omite existentes por code', async () => {
    existing = [{ id: 9, code: 'BIENVENIDA' }]
    const res = await post({ csv })
    const data = await res.json()
    expect(data.created).toBe(1)
    expect(data.skipped.some((s: any) => s.slug === 'BIENVENIDA')).toBe(true)
  })

  it('upsert actualiza el existente', async () => {
    existing = [{ id: 9, code: 'BIENVENIDA' }]
    const res = await post({ csv, mode: 'upsert' })
    const data = await res.json()
    expect(data.updated).toBe(1)
    expect(updated[0]).toMatchObject({ id: 9, input: { value: 10 } })
  })

  it('preview no escribe', async () => {
    const res = await post({ csv, preview: true })
    const data = await res.json()
    expect(data.preview).toBe(true)
    expect(created).toHaveLength(0)
  })
})
