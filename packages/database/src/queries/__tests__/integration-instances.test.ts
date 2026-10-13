/**
 * Unit tests — capa de datos de integration_instances (ADR-004 · HU-275).
 * Verifica: merge de credentials al actualizar y la secuencia off→on al activar.
 */
import { updateInstance, setActiveInstance } from '../integration-instances'

type Call = { op: string; payload?: any; eqs: [string, unknown][] }

/** Fake encadenable mínimo del builder de Supabase (thenable). */
function fakeDb(opts: { maybeSingle?: any; single?: any } = {}) {
  const calls: Call[] = []
  function builder() {
    const c: Call = { op: 'select', eqs: [] }
    const b: any = {}
    b.select = () => b
    b.insert = (p: any) => { c.op = 'insert'; c.payload = p; return b }
    b.update = (p: any) => { c.op = 'update'; c.payload = p; return b }
    b.delete = () => { c.op = 'delete'; return b }
    b.order = () => b
    b.eq = (k: string, v: unknown) => { c.eqs.push([k, v]); return b }
    b.maybeSingle = () => { calls.push(c); return Promise.resolve(opts.maybeSingle ?? { data: null, error: null }) }
    b.single = () => { calls.push(c); return Promise.resolve(opts.single ?? { data: {}, error: null }) }
    // Awaiting the chain (p. ej. tras .eq()) resuelve sin error.
    b.then = (resolve: (v: any) => void) => { calls.push(c); resolve({ data: null, error: null }) }
    return b
  }
  const db: any = { from: () => builder() }
  return { db, calls }
}

const ROW = {
  id: 'i1', tenant_id: 't1', kind: 'payment', provider: 'wompi', label: null,
  environment: 'test', credentials: {}, settings: {}, enabled: true, is_active: false,
  created_at: 'now', updated_at: 'now',
}

describe('updateInstance — merge de credentials', () => {
  it('mergea las credenciales nuevas sobre las existentes (no borra secretos)', async () => {
    const { db, calls } = fakeDb({
      maybeSingle: { data: { credentials: { pub: 'A', priv: 'B' }, settings: {} }, error: null },
      single: { data: { ...ROW, credentials: { pub: 'A', priv: 'B', events: 'C' } }, error: null },
    })
    await updateInstance(db, 't1', 'i1', { credentials: { events: 'C' } })
    const upd = calls.find((c) => c.op === 'update')!
    expect(upd.payload.credentials).toEqual({ pub: 'A', priv: 'B', events: 'C' })
  })
})

describe('setActiveInstance — secuencia off→on', () => {
  it('desactiva las activas y luego activa la elegida', async () => {
    const { db, calls } = fakeDb()
    await setActiveInstance(db, 't1', 'payment', 'i2')
    const updates = calls.filter((c) => c.op === 'update')
    expect(updates[0].payload).toEqual({ is_active: false })
    expect(updates[1].payload).toEqual({ is_active: true })
    expect(updates[1].eqs).toContainEqual(['id', 'i2'])
  })
  it('con id null solo desactiva (deja ninguna activa)', async () => {
    const { db, calls } = fakeDb()
    await setActiveInstance(db, 't1', 'payment', null)
    const updates = calls.filter((c) => c.op === 'update')
    expect(updates).toHaveLength(1)
    expect(updates[0].payload).toEqual({ is_active: false })
  })
})
