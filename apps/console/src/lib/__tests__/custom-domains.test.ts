import { addDomain, setPrimaryDomain, activateDomain } from '../custom-domains'

const T = 'tenant-1'

type Call = { op: string; payload?: Record<string, unknown>; eqs: [string, unknown][] }

/** db falso encadenable que registra operaciones. */
function fakeDb(opts: { single?: { data?: unknown; error?: { code?: string; message?: string } | null }; maybeSingle?: { data?: unknown } } = {}) {
  const calls: Call[] = []
  function builder() {
    const c: Call = { op: 'select', eqs: [] }
    const b: Record<string, unknown> = {}
    b.select = () => b
    b.insert = (p: Record<string, unknown>) => { c.op = 'insert'; c.payload = p; return b }
    b.update = (p: Record<string, unknown>) => { c.op = 'update'; c.payload = p; return b }
    b.delete = () => { c.op = 'delete'; return b }
    b.order = () => b
    b.eq = (k: string, v: unknown) => { c.eqs.push([k, v]); return b }
    b.maybeSingle = () => { calls.push(c); return Promise.resolve(opts.maybeSingle ?? { data: null }) }
    b.single = () => { calls.push(c); return Promise.resolve(opts.single ?? { data: { id: 'd1' }, error: null }) }
    b.then = (res: (v: unknown) => void) => { calls.push(c); res({ data: null, error: null }) }
    return b
  }
  return { db: { from: () => builder() }, calls }
}

describe('addDomain (HU-279)', () => {
  it('rechaza dominio inválido o de la plataforma', async () => {
    const { db } = fakeDb()
    expect((await addDomain(db, T, 'no-tld')).ok).toBe(false)
    expect((await addDomain(db, T, 'x.merkiai.com')).ok).toBe(false)
  })
  it('normaliza, inserta pending con token y devuelve TXT', async () => {
    const { db, calls } = fakeDb({ single: { data: { id: 'd1' }, error: null } })
    const res = await addDomain(db, T, 'HTTPS://www.MiTienda.com/', () => 0.5)
    expect(res).toMatchObject({ ok: true, id: 'd1', domain: 'mitienda.com', txtName: '_merkiai-verify.mitienda.com' })
    const ins = calls.find((c) => c.op === 'insert')!
    expect(ins.payload).toMatchObject({ domain: 'mitienda.com', status: 'pending', is_primary: false })
    expect((ins.payload as Record<string, string>).verify_token).toMatch(/^[0-9a-f]{32}$/)
  })
  it('dominio duplicado (23505) → error claro', async () => {
    const { db } = fakeDb({ single: { error: { code: '23505' } } })
    expect(await addDomain(db, T, 'mitienda.com')).toMatchObject({ ok: false, error: expect.stringMatching(/ya está registrado/i) })
  })
})

describe('setPrimaryDomain (HU-279)', () => {
  it('no permite si el dominio sigue pending', async () => {
    const { db } = fakeDb({ maybeSingle: { data: { status: 'pending' } } })
    expect(await setPrimaryDomain(db, T, 'd1')).toMatchObject({ ok: false })
  })
  it('desmarca el primario anterior y marca el nuevo activo', async () => {
    const { db, calls } = fakeDb({ maybeSingle: { data: { status: 'verified' } } })
    expect(await setPrimaryDomain(db, T, 'd2')).toEqual({ ok: true })
    const updates = calls.filter((c) => c.op === 'update')
    expect(updates[0].payload).toEqual({ is_primary: false })
    expect(updates[1].payload).toEqual({ is_primary: true, status: 'active' })
  })
})

describe('activateDomain (HU-279)', () => {
  it('no activa si sigue pending', async () => {
    const { db } = fakeDb({ maybeSingle: { data: { status: 'pending' } } })
    expect(await activateDomain(db, T, 'd1')).toMatchObject({ ok: false })
  })
  it('marca status=active (alias) sin tocar is_primary', async () => {
    const { db, calls } = fakeDb({ maybeSingle: { data: { status: 'verified' } } })
    expect(await activateDomain(db, T, 'd1')).toEqual({ ok: true })
    const upd = calls.find((c) => c.op === 'update')!
    expect(upd.payload).toEqual({ status: 'active' })
  })
})
