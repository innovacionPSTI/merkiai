/**
 * @jest-environment node
 */
import { VercelHostingProvider } from '../vercel'
import { ManualHostingProvider } from '../manual'
import { provisionMessage } from '../index'

const OLD = process.env
afterEach(() => { process.env = OLD })
const withEnv = (e: Record<string, string | undefined>) => { process.env = { ...OLD, ...e } }
const resp = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as any

describe('VercelHostingProvider.linkDomain', () => {
  it('no_configured cuando falta token/proyecto', async () => {
    withEnv({ HOSTING_API_TOKEN: undefined, HOSTING_PROJECT_ID: undefined })
    const p = new VercelHostingProvider(jest.fn() as any)
    expect(await p.linkDomain('x.com')).toMatchObject({ ok: false, code: 'not_configured' })
  })
  it('ok al registrar; 409 es idempotente', async () => {
    withEnv({ HOSTING_API_TOKEN: 't', HOSTING_PROJECT_ID: 'prj' })
    expect(await new VercelHostingProvider(jest.fn(async () => resp({})) as any).linkDomain('x.com')).toEqual({ ok: true })
    expect(await new VercelHostingProvider(jest.fn(async () => resp({ error: { code: 'domain_already_in_use' } }, 409)) as any).linkDomain('x.com')).toEqual({ ok: true })
  })
  it('registra apex + www como redirección 308 (HU-174 v4)', async () => {
    withEnv({ HOSTING_API_TOKEN: 't', HOSTING_PROJECT_ID: 'prj' })
    const calls: any[] = []
    const fetchMock = jest.fn(async (_url: string, init: any) => { calls.push(JSON.parse(init.body)); return resp({}) })
    const r = await new VercelHostingProvider(fetchMock as any).linkDomain('www.mitienda.com')
    expect(r).toEqual({ ok: true })
    expect(calls[0]).toEqual({ name: 'mitienda.com' })
    expect(calls[1]).toMatchObject({ name: 'www.mitienda.com', redirect: 'mitienda.com', redirectStatusCode: 308 })
  })
  it('www best-effort: si falla, el apex igual queda ok', async () => {
    withEnv({ HOSTING_API_TOKEN: 't', HOSTING_PROJECT_ID: 'prj' })
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(resp({}))                                   // apex ok
      .mockResolvedValueOnce(resp({ error: { message: 'boom' } }, 500))  // www falla
    expect(await new VercelHostingProvider(fetchMock as any).linkDomain('mitienda.com')).toMatchObject({ ok: true })
  })
  it('project not found → code not_configured (detalle solo interno)', async () => {
    withEnv({ HOSTING_API_TOKEN: 't', HOSTING_PROJECT_ID: 'prj' })
    const r = await new VercelHostingProvider(jest.fn(async () => resp({ error: { code: 'not_found', message: 'Project not found' } }, 404)) as any).linkDomain('x.com')
    expect(r.ok).toBe(false)
    expect(r.code).toBe('not_configured')
    expect(r.internalDetail).toContain('Project not found')
  })
})

describe('VercelHostingProvider.getStatus', () => {
  it('awaiting_dns con registros de validación si no está verificado', async () => {
    withEnv({ HOSTING_API_TOKEN: 't', HOSTING_PROJECT_ID: 'prj' })
    const fetchMock = jest.fn(async () => resp({ verified: false, verification: [{ type: 'CNAME', domain: '_x.mitienda.com', value: '_y.vercel' }] }))
    const s = await new VercelHostingProvider(fetchMock as any).getStatus('mitienda.com')
    expect(s.state).toBe('awaiting_dns')
    expect(s.records[0]).toMatchObject({ type: 'CNAME', name: '_x.mitienda.com', purpose: 'Validación de certificado' })
  })
  it('active cuando verificado y bien configurado', async () => {
    withEnv({ HOSTING_API_TOKEN: 't', HOSTING_PROJECT_ID: 'prj' })
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(resp({ verified: true }))     // domain
      .mockResolvedValueOnce(resp({ misconfigured: false })) // config
    const s = await new VercelHostingProvider(fetchMock as any).getStatus('mitienda.com')
    expect(s).toMatchObject({ state: 'active', active: true })
  })
})

describe('ManualHostingProvider', () => {
  it('active cuando el A del dominio apunta a la IP del host', async () => {
    const p = new ManualHostingProvider('1.2.3.4', async () => ['1.2.3.4'])
    expect(await p.getStatus('mitienda.com')).toMatchObject({ state: 'active', active: true })
  })
  it('awaiting_dns con registro A si aún no apunta', async () => {
    const p = new ManualHostingProvider('1.2.3.4', async () => ['9.9.9.9'])
    const s = await p.getStatus('mitienda.com')
    expect(s.state).toBe('awaiting_dns')
    expect(s.records[0]).toMatchObject({ type: 'A', name: '@', value: '1.2.3.4' })
  })
})

describe('provisionMessage', () => {
  it('no filtra detalles de infraestructura', () => {
    const msg = provisionMessage('not_configured')
    expect(msg).not.toMatch(/vercel|project|token|env/i)
    expect(provisionMessage('conflict')).toMatch(/ya está en uso/i)
  })
})
