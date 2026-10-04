import { requestDomain, verifyDomain } from '../domain-service'
import { expectedTxtValue } from '../domain-verification'

const T = 'tenant-1'

/** db falso: registra updates y sirve un tenant configurable. */
function fakeDb(tenant: Record<string, unknown> = {}) {
  const updates: Record<string, unknown>[] = []
  return {
    updates,
    from() {
      return {
        update(row: Record<string, unknown>) {
          updates.push(row)
          return { eq: () => Promise.resolve({ error: null }) }
        },
        select() {
          return { eq: () => ({ maybeSingle: () => Promise.resolve({ data: tenant }) }) }
        },
      }
    },
  }
}

describe('requestDomain (HU-174)', () => {
  it('rechaza dominio inválido o de la plataforma', async () => {
    expect((await requestDomain(fakeDb(), T, 'no-tld')).ok).toBe(false)
    expect((await requestDomain(fakeDb(), T, 'x.merkiai.com')).ok).toBe(false)
  })

  it('normaliza, deja pending y devuelve instrucciones TXT', async () => {
    const db = fakeDb()
    const res = await requestDomain(db, T, 'HTTPS://www.MiTienda.com/', () => 0.5)
    expect(res).toMatchObject({ ok: true, domain: 'mitienda.com', txtName: '_merkiai-verify.mitienda.com' })
    expect(res.txtValue).toMatch(/^merkiai-domain-verification=[0-9a-f]{32}$/)
    expect(db.updates[0]).toMatchObject({ domain_requested: 'mitienda.com', domain_status: 'pending' })
  })
})

describe('verifyDomain (HU-174)', () => {
  it('sin dominio pendiente → error', async () => {
    const res = await verifyDomain(fakeDb({}), T, async () => [])
    expect(res.ok).toBe(false)
  })

  it('TXT ausente → pending', async () => {
    const db = fakeDb({ domain_requested: 'mitienda.com', domain_verify_token: 'tok', domain_status: 'pending' })
    const res = await verifyDomain(db, T, async () => ['otro'])
    expect(res).toMatchObject({ ok: false, status: 'pending' })
  })

  it('TXT coincide → verified y persiste', async () => {
    const db = fakeDb({ domain_requested: 'mitienda.com', domain_verify_token: 'tok', domain_status: 'pending' })
    const res = await verifyDomain(db, T, async () => [expectedTxtValue('tok')])
    expect(res).toMatchObject({ ok: true, status: 'verified' })
    expect(db.updates.at(-1)).toMatchObject({ domain_status: 'verified' })
  })

  it('tolera fallo del resolver (red) → pending', async () => {
    const db = fakeDb({ domain_requested: 'mitienda.com', domain_verify_token: 'tok', domain_status: 'pending' })
    const res = await verifyDomain(db, T, async () => { throw new Error('ENOTFOUND') })
    expect(res.ok).toBe(false)
  })
})
