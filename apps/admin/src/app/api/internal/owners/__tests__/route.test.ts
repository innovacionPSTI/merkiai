/**
 * @jest-environment node
 *
 * POST /api/internal/owners — crea/actualiza el profiles del dueño (HU-209).
 */
import { NextRequest } from 'next/server'

jest.mock('@merkiai/database', () => ({ createServerClient: jest.fn() }))
import { createServerClient } from '@merkiai/database'
import { POST } from '../route'

const SECRET = 'secreto-interno'

/** Builder encadenable de Supabase que registra la operación. */
function mockDb(existing: { id: string; role: string } | null) {
  const calls = { inserted: null as unknown, updated: null as unknown }
  const b: Record<string, unknown> = {}
  b.select = jest.fn(() => b)
  b.eq = jest.fn(() => b)
  b.maybeSingle = jest.fn(async () => ({ data: existing }))
  b.insert = jest.fn((v: unknown) => { calls.inserted = v; return { then: (r: (x: unknown) => void) => r({ error: null }) } })
  b.update = jest.fn((v: unknown) => { calls.updated = v; return b })
  // update().eq().eq() → thenable
  const upEq = jest.fn(() => ({ eq: jest.fn(async () => ({ error: null })) }))
  ;(b.update as jest.Mock).mockImplementation((v: unknown) => { calls.updated = v; return { eq: upEq } })
  ;(createServerClient as jest.Mock).mockReturnValue({ from: jest.fn(() => b) })
  return calls
}

function req(body: object, opts: { secret?: string; origin?: boolean } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.secret !== null) headers['x-internal-secret'] = opts.secret ?? SECRET
  if (opts.origin) headers['origin'] = 'https://evil.com'
  return new NextRequest('http://localhost/api/internal/owners', { method: 'POST', headers, body: JSON.stringify(body) })
}

beforeAll(() => { process.env.INTERNAL_API_SECRET = SECRET })
beforeEach(() => jest.clearAllMocks())

describe('POST /api/internal/owners', () => {
  it('401 sin secreto válido', async () => {
    mockDb(null)
    const res = await POST(req({ email: 'd@x.com', tenantId: 't1' }, { secret: 'malo' }))
    expect(res.status).toBe(401)
  })

  it('401 si viene con Origin (navegador)', async () => {
    mockDb(null)
    const res = await POST(req({ email: 'd@x.com', tenantId: 't1' }, { origin: true }))
    expect(res.status).toBe(401)
  })

  it('400 si falta email o tenantId', async () => {
    mockDb(null)
    expect((await POST(req({ email: 'd@x.com' }))).status).toBe(400)
    expect((await POST(req({ tenantId: 't1' }))).status).toBe(400)
  })

  it('400 rol no asignable (super_admin bloqueado)', async () => {
    mockDb(null)
    const res = await POST(req({ email: 'd@x.com', tenantId: 't1', role: 'super_admin' }))
    expect(res.status).toBe(400)
  })

  it('crea profiles con rol admin + tenant_id cuando no existe', async () => {
    const calls = mockDb(null)
    const res = await POST(req({ email: 'D@X.com', tenantId: 't1', role: 'admin' }))
    expect(res.status).toBe(201)
    expect(calls.inserted).toMatchObject({ email: 'd@x.com', role: 'admin', tenant_id: 't1' })
  })

  it('actualiza el rol si el profiles ya existe', async () => {
    const calls = mockDb({ id: 'p1', role: 'miembro' })
    const res = await POST(req({ email: 'd@x.com', tenantId: 't1', role: 'admin' }))
    expect(res.status).toBe(200)
    expect(calls.updated).toMatchObject({ role: 'admin' })
  })

  it('no toca a un super_admin existente', async () => {
    const calls = mockDb({ id: 'p1', role: 'super_admin' })
    const res = await POST(req({ email: 'd@x.com', tenantId: 't1', role: 'admin' }))
    expect(res.status).toBe(200)
    expect(calls.updated).toBeNull()
  })
})
