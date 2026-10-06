import { addDomainToVercel, removeDomainFromVercel } from '../vercel'

const OLD = process.env

afterEach(() => { process.env = OLD })

function withEnv(env: Record<string, string | undefined>) {
  process.env = { ...OLD, ...env }
}

const okJson = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as any

describe('addDomainToVercel', () => {
  it('no-op (skipped) si falta configuración', async () => {
    withEnv({ VERCEL_API_TOKEN: undefined, VERCEL_PROJECT_ID: undefined })
    const fetchMock = jest.fn()
    const r = await addDomainToVercel('mitienda.com', fetchMock as any)
    expect(r).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('registra el dominio en el proyecto', async () => {
    withEnv({ VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj_1', VERCEL_TEAM_ID: 'team_1' })
    const fetchMock = jest.fn(async () => okJson({ name: 'mitienda.com', verified: false, verification: [{ type: 'TXT' }] }))
    const r = await addDomainToVercel('mitienda.com', fetchMock as any)
    expect(r.ok).toBe(true)
    expect(r.verified).toBe(false)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, any]
    expect(url).toContain('/v10/projects/prj_1/domains')
    expect(url).toContain('teamId=team_1')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body).name).toBe('mitienda.com')
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('trata "ya existe" (409) como éxito idempotente', async () => {
    withEnv({ VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj_1' })
    const fetchMock = jest.fn(async () => okJson({ error: { code: 'domain_already_in_use' } }, 409))
    const r = await addDomainToVercel('mitienda.com', fetchMock as any)
    expect(r.ok).toBe(true)
  })

  it('reporta error de Vercel', async () => {
    withEnv({ VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj_1' })
    const fetchMock = jest.fn(async () => okJson({ error: { message: 'forbidden' } }, 403))
    const r = await addDomainToVercel('mitienda.com', fetchMock as any)
    expect(r).toMatchObject({ ok: false, error: 'forbidden' })
  })
})

describe('removeDomainFromVercel', () => {
  it('DELETE ok; 404 también cuenta como éxito', async () => {
    withEnv({ VERCEL_API_TOKEN: 'tok', VERCEL_PROJECT_ID: 'prj_1' })
    const fetchMock = jest.fn(async () => okJson({}, 404))
    const r = await removeDomainFromVercel('mitienda.com', fetchMock as any)
    expect(r.ok).toBe(true)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, any]
    expect(init.method).toBe('DELETE')
  })
})
