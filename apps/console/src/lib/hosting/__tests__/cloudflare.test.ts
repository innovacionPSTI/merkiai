/**
 * @jest-environment node
 */
import { CloudflareSaasHostingProvider, toProvisionStatus, cnameRecords } from '../cloudflare'

const cfg = { zoneId: 'zone1', cnameTarget: 'customers.merkiai.com' }
const token = async () => 'cf-token'
const resp = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response

describe('toProvisionStatus', () => {
  const pending = {
    id: 'h1', hostname: 'mitienda.com', status: 'pending',
    ownership_verification: { type: 'txt', name: '_cf-custom-hostname.mitienda.com', value: 'own-1' },
    ssl: { status: 'pending_validation', validation_records: [{ txt_name: '_acme-challenge.mitienda.com', txt_value: 'dcv-1' }] },
  }
  it('sin hostname → solo CNAME', () => {
    expect(toProvisionStatus(null, 'mitienda.com', 'customers.merkiai.com')).toEqual({ state: 'awaiting_dns', records: cnameRecords('mitienda.com', 'customers.merkiai.com'), active: false })
  })
  it('pendiente → TXT de propiedad + TXT del certificado + CNAME', () => {
    const s = toProvisionStatus(pending, 'mitienda.com', 'customers.merkiai.com')
    expect(s.state).toBe('awaiting_dns')
    expect(s.records.map((r) => `${r.type} ${r.name}=${r.value}`)).toEqual([
      'TXT _cf-custom-hostname.mitienda.com=own-1',
      'TXT _acme-challenge.mitienda.com=dcv-1',
      'CNAME www.mitienda.com=customers.merkiai.com',
      'CNAME mitienda.com=customers.merkiai.com',
    ])
  })
  it('hostname activo, certificado pendiente → certificate', () => {
    const s = toProvisionStatus({ ...pending, status: 'active' }, 'mitienda.com', 'x')
    expect(s.state).toBe('certificate')
    expect(s.records.some((r) => r.name.startsWith('_cf-custom-hostname'))).toBe(false)
  })
  it('ambos activos → active sin registros; bloqueado → error', () => {
    expect(toProvisionStatus({ ...pending, status: 'active', ssl: { status: 'active' } }, 'mitienda.com', 'x')).toEqual({ state: 'active', records: [], active: true })
    expect(toProvisionStatus({ ...pending, status: 'blocked' }, 'mitienda.com', 'x').state).toBe('error')
  })
})

describe('CloudflareSaasHostingProvider', () => {
  it('sin token/zona/destino → not_configured', async () => {
    expect(await new CloudflareSaasHostingProvider(async () => null, cfg, jest.fn()).linkDomain('x.com')).toMatchObject({ ok: false, code: 'not_configured' })
    expect(await new CloudflareSaasHostingProvider(token, { zoneId: 'z' }, jest.fn()).linkDomain('x.com')).toMatchObject({ ok: false, code: 'not_configured' })
  })
  it('alta: apex + www con validación TXT y Bearer', async () => {
    const f = jest.fn(async () => resp({ success: true, result: { id: 'h' } }))
    expect(await new CloudflareSaasHostingProvider(token, cfg, f as unknown as typeof fetch).linkDomain('www.MiTienda.com')).toEqual({ ok: true })
    const calls = f.mock.calls as unknown as [string, RequestInit][]
    expect(calls[0][0]).toBe('https://api.cloudflare.com/client/v4/zones/zone1/custom_hostnames')
    expect((calls[0][1].headers as Record<string, string>).Authorization).toBe('Bearer cf-token')
    expect(JSON.parse(calls[0][1].body as string)).toEqual({ hostname: 'mitienda.com', ssl: { method: 'txt', type: 'dv' } })
    expect(JSON.parse(calls[1][1].body as string).hostname).toBe('www.mitienda.com')
  })
  it('duplicado en nuestra zona → idempotente; en otra → conflict', async () => {
    const dup = resp({ success: false, errors: [{ code: 1406, message: 'Duplicate custom hostname found.' }] }, 409)
    const ours = jest.fn()
      .mockResolvedValueOnce(dup).mockResolvedValueOnce(resp({ success: true, result: [{ id: 'h', hostname: 'x.com' }] }))
      .mockResolvedValue(resp({ success: true }))
    expect(await new CloudflareSaasHostingProvider(token, cfg, ours as unknown as typeof fetch).linkDomain('x.com')).toMatchObject({ ok: true })
    const theirs = jest.fn().mockResolvedValueOnce(dup).mockResolvedValueOnce(resp({ success: true, result: [] }))
    expect(await new CloudflareSaasHostingProvider(token, cfg, theirs as unknown as typeof fetch).linkDomain('x.com')).toMatchObject({ ok: false, code: 'conflict' })
  })
  it('token inválido → not_configured (detalle solo interno)', async () => {
    const f = jest.fn(async () => resp({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }, 403))
    const r = await new CloudflareSaasHostingProvider(token, cfg, f as unknown as typeof fetch).linkDomain('x.com')
    expect(r).toMatchObject({ ok: false, code: 'not_configured' })
    expect(r.internalDetail).toMatch(/Authentication/)
  })
  it('baja: busca y borra apex y www', async () => {
    const f = jest.fn(async (url: string) => url.includes('?hostname=')
      ? resp({ success: true, result: [{ id: url.includes('www') ? 'h-www' : 'h-apex', hostname: decodeURIComponent(url.split('hostname=')[1]) }] })
      : resp({ success: true }))
    expect(await new CloudflareSaasHostingProvider(token, cfg, f as unknown as typeof fetch).unlinkDomain('x.com')).toEqual({ ok: true })
    const deletes = (f.mock.calls as unknown as [string, RequestInit][]).filter(([, i]) => i?.method === 'DELETE').map(([u]) => u)
    expect(deletes).toEqual([
      'https://api.cloudflare.com/client/v4/zones/zone1/custom_hostnames/h-apex',
      'https://api.cloudflare.com/client/v4/zones/zone1/custom_hostnames/h-www',
    ])
  })
  it('estado: consulta el apex y traduce', async () => {
    const f = jest.fn(async () => resp({ success: true, result: [{ id: 'h', hostname: 'x.com', status: 'active', ssl: { status: 'active' } }] }))
    expect(await new CloudflareSaasHostingProvider(token, cfg, f as unknown as typeof fetch).getStatus('www.x.com')).toEqual({ state: 'active', records: [], active: true })
  })
})
