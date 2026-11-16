/**
 * @jest-environment node
 *
 * HU-359 · AC-2 — bloques que el plan puede apagar: crear un `partial_ref` o un
 * `collection_list` se rechaza (403) solo si el plan apaga la capacidad.
 */
jest.mock('@/lib/auth', () => ({ getAdminUser: jest.fn(async () => ({ id: 'u1', email: 'a@b.co', role: 'super_admin', tenantId: 't1' })) }))
const insert = jest.fn(() => ({ select: () => ({ single: async () => ({ data: { id: 9 }, error: null }) }) }))
jest.mock('@/lib/admin-db', () => ({ getAdminDb: () => ({ from: () => ({ insert }) }) }))
jest.mock('@merkiai/database', () => ({ createServerClient: jest.fn(), getBlockSchema: jest.fn(() => undefined) }))
const denied = jest.fn()
jest.mock('@/lib/entitlements', () => ({
  ...jest.requireActual('@merkiai/tenancy'),
  getTenantEntitlements: jest.fn(async () => ({ entitlements: null })),
  featureDeniedMessage: (...args: unknown[]) => denied(...args),
}))

import { NextRequest } from 'next/server'
import { POST } from '../[resource]/route'

const req = (body: object) => new NextRequest('http://localhost/api/admin/cms/sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const params = { params: Promise.resolve({ resource: 'sections' }) }

beforeEach(() => { denied.mockReset(); insert.mockClear() })

it('plan sin partials globales → 403 y no inserta', async () => {
  denied.mockResolvedValue('Tu plan no incluye: Partials globales.')
  const res = await POST(req({ page_key: 'home', section_type: 'partial_ref' }), params)
  expect(res.status).toBe(403)
  expect(denied).toHaveBeenCalledWith('t1', 'partials_globales')
  expect(insert).not.toHaveBeenCalled()
})

it('capacidad permitida → crea la sección', async () => {
  denied.mockResolvedValue(null)
  const res = await POST(req({ page_key: 'home', section_type: 'collection_list' }), params)
  expect(res.status).toBe(201)
  expect(denied).toHaveBeenCalledWith('t1', 'listado_dinamico')
})

it('bloques sin capacidad asociada no consultan el plan', async () => {
  const res = await POST(req({ page_key: 'home', section_type: 'hero' }), params)
  expect(res.status).toBe(201)
  expect(denied).not.toHaveBeenCalled()
})
