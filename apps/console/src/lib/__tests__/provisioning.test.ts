import { provisionTenant } from '../provisioning'

/** Mock encadenable de la BD de plataforma. Registra insert/update/delete. */
function makeDb(opts: { existingId?: string | null; insertedId?: string | null }) {
  const calls = { deleted: false, updated: null as unknown, inserted: null as unknown }
  const from = jest.fn(() => {
    const b: Record<string, unknown> = {}
    b.select = jest.fn(() => b)
    b.eq = jest.fn(() => b)
    b.insert = jest.fn((v: unknown) => { calls.inserted = v; return b })
    b.update = jest.fn((v: unknown) => { calls.updated = v; return b })
    b.delete = jest.fn(() => { calls.deleted = true; return b })
    b.maybeSingle = jest.fn(async () => ({ data: opts.existingId ? { id: opts.existingId } : null }))
    b.single = jest.fn(async () => ({ data: opts.insertedId ? { id: opts.insertedId } : null, error: null }))
    b.then = (r: (v: unknown) => void) => r({ error: null })
    return b
  })
  return { db: { from } as never, calls }
}

function idOK() {
  return {
    createOrg: jest.fn(async () => ({ orgId: 'team-1' })),
    inviteMember: jest.fn(async () => {}),
    getCurrentUser: jest.fn(),
    hasPlatformPermission: jest.fn(),
    hasOrgPermission: jest.fn(),
    addMember: jest.fn(),
    grantOrgPermission: jest.fn(),
  } as never as Parameters<typeof provisionTenant>[1]['adminIdentity']
}

describe('provisionTenant (HU-209)', () => {
  it('crea tenant + Team + invita al dueño y guarda stack_team_id', async () => {
    const { db, calls } = makeDb({ existingId: null, insertedId: 't-1' })
    const identity = idOK()!
    const res = await provisionTenant({ name: 'Tienda', subdomain: 'demo', ownerEmail: 'due@x.com' }, { db, adminIdentity: identity })
    expect(res).toMatchObject({ tenantId: 't-1', teamId: 'team-1' })
    expect((identity.createOrg as jest.Mock)).toHaveBeenCalled()
    expect((identity.inviteMember as jest.Mock)).toHaveBeenCalledWith('team-1', 'due@x.com')
    expect(calls.updated).toMatchObject({ stack_team_id: 'team-1' })
    expect(calls.deleted).toBe(false)
  })

  it('sin adminIdentity → provisioning parcial (sin Team)', async () => {
    const { db } = makeDb({ existingId: null, insertedId: 't-2' })
    const res = await provisionTenant({ name: 'Tienda', subdomain: 'demo2' }, { db, adminIdentity: null })
    expect(res.teamId).toBeNull()
    expect(res.warnings.some((w) => /parcial/i.test(w))).toBe(true)
  })

  it('rechaza subdominio en uso', async () => {
    const { db } = makeDb({ existingId: 'exists', insertedId: 't-x' })
    await expect(provisionTenant({ name: 'T', subdomain: 'demo' }, { db, adminIdentity: null })).rejects.toThrow(/en uso/)
  })

  it('rechaza subdominio inválido', async () => {
    const { db } = makeDb({ existingId: null, insertedId: 't-4' })
    await expect(provisionTenant({ name: 'T', subdomain: 'X' }, { db, adminIdentity: null })).rejects.toThrow(/inválido/)
  })

  it('parcial: si createOrg falla, conserva el tenant y reporta warning (no borra)', async () => {
    const { db, calls } = makeDb({ existingId: null, insertedId: 't-3' })
    const identity = idOK()!
    ;(identity.createOrg as jest.Mock).mockImplementation(async () => { throw new Error('stack down') })
    const res = await provisionTenant({ name: 'T', subdomain: 'demo3', ownerEmail: 'd@x.com' }, { db, adminIdentity: identity })
    expect(res.tenantId).toBe('t-3')
    expect(res.teamId).toBeNull()
    expect(calls.deleted).toBe(false)
    expect(res.warnings.some((w) => /Team.*Stack Auth.*stack down/i.test(w))).toBe(true)
    // Sin Team no se intenta invitar al dueño.
    expect((identity.inviteMember as jest.Mock)).not.toHaveBeenCalled()
  })

  it('parcial: Team creado pero invitación falla → conserva Team y avisa', async () => {
    const { db, calls } = makeDb({ existingId: null, insertedId: 't-5' })
    const identity = idOK()!
    ;(identity.inviteMember as jest.Mock).mockImplementation(async () => { throw new Error('smtp down') })
    const res = await provisionTenant({ name: 'T', subdomain: 'demo5', ownerEmail: 'd@x.com' }, { db, adminIdentity: identity })
    expect(res.teamId).toBe('team-1')
    expect(calls.deleted).toBe(false)
    expect(res.warnings.some((w) => /invitar al dueño.*smtp down/i.test(w))).toBe(true)
  })

  it('propaga el plan elegido al metadata del Team', async () => {
    const { db } = makeDb({ existingId: null, insertedId: 't-6' })
    const identity = idOK()!
    await provisionTenant({ name: 'T', subdomain: 'demo6', plan: 'pro' }, { db, adminIdentity: identity })
    expect((identity.createOrg as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ plan: 'pro' }) }),
    )
  })
})
