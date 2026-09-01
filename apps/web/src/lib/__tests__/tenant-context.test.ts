/**
 * @jest-environment node
 *
 * HU-157 — resolución host→tenant vía el control plane.
 * Prueba la unidad pura `controlPlaneResolver` (sin `headers()` de Next).
 */
let mockHost = 'demo.merkiai.com'
jest.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => (k === 'host' ? mockHost : null) }),
}))

import { controlPlaneResolver, resolveTenant } from '../tenant-context'
import type { TenantResolver } from '../tenant-context'

describe('controlPlaneResolver (HU-157)', () => {
  const OLD = { ...process.env }
  const g = global as unknown as { fetch: jest.Mock }

  beforeEach(() => { g.fetch = jest.fn() })
  afterEach(() => { process.env = { ...OLD } })

  it('devuelve null sin CONTROL_PLANE_URL / INTERNAL_API_SECRET (no llama al control plane)', async () => {
    delete process.env.CONTROL_PLANE_URL
    delete process.env.INTERNAL_API_SECRET
    expect(await controlPlaneResolver.resolveByHost('demo.merkiai.com')).toBeNull()
    expect(g.fetch).not.toHaveBeenCalled()
  })

  it('resuelve el tenant y envía el secreto interno (server-to-server)', async () => {
    process.env.CONTROL_PLANE_URL = 'https://merkiai.com'
    process.env.INTERNAL_API_SECRET = 'secreto-interno'
    g.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tenantId: 't1', subdomain: 'demo', status: 'active', plan: 'pro' }),
    })

    const r = await controlPlaneResolver.resolveByHost('demo.merkiai.com')
    expect(r).toMatchObject({ tenantId: 't1', subdomain: 'demo', status: 'active', plan: 'pro' })

    const [url, init] = g.fetch.mock.calls[0]
    expect(url).toContain('/api/internal/resolve-tenant?host=demo.merkiai.com')
    expect(init.headers['x-internal-secret']).toBe('secreto-interno')
    expect(init.cache).toBe('no-store')
  })

  it('devuelve null si el control plane responde no-ok', async () => {
    process.env.CONTROL_PLANE_URL = 'https://merkiai.com'
    process.env.INTERNAL_API_SECRET = 'secreto-interno'
    g.fetch.mockResolvedValue({ ok: false, json: async () => ({}) })
    expect(await controlPlaneResolver.resolveByHost('desconocido.merkiai.com')).toBeNull()
  })

  it('devuelve null si el body no trae tenantId', async () => {
    process.env.CONTROL_PLANE_URL = 'https://merkiai.com'
    process.env.INTERNAL_API_SECRET = 'secreto-interno'
    g.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    expect(await controlPlaneResolver.resolveByHost('x.merkiai.com')).toBeNull()
  })

  it('devuelve null si fetch lanza (error de red)', async () => {
    process.env.CONTROL_PLANE_URL = 'https://merkiai.com'
    process.env.INTERNAL_API_SECRET = 'secreto-interno'
    g.fetch.mockRejectedValue(new Error('network'))
    expect(await controlPlaneResolver.resolveByHost('x.merkiai.com')).toBeNull()
  })
})

describe('resolveTenant — modo estricto (HU-229)', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD }; mockHost = 'demo.merkiai.com' })

  const unknown: TenantResolver = { async resolveByHost() { return null } }
  const found: TenantResolver = { async resolveByHost() { return { tenantId: 't9', subdomain: 'demo', primaryDomain: null } } }

  it('interino (default): host desconocido → tenant por defecto (fail-open)', async () => {
    delete process.env.TENANT_RESOLUTION_STRICT
    const r = await resolveTenant(unknown)
    expect(r.subdomain).toBe('default')
  })

  it('estricto: host desconocido → lanza (fail-closed)', async () => {
    process.env.TENANT_RESOLUTION_STRICT = 'true'
    await expect(resolveTenant(unknown)).rejects.toThrow(/no asociado a un tenant/)
  })

  it('estricto: host que resuelve → devuelve el tenant', async () => {
    process.env.TENANT_RESOLUTION_STRICT = 'true'
    mockHost = 'otra.merkiai.com' // evita la caché de hosts previos
    const r = await resolveTenant(found)
    expect(r.tenantId).toBe('t9')
  })
})
