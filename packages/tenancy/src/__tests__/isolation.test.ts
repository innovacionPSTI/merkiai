/**
 * PoC HU-171 — Test de aislamiento cross-tenant.
 *
 * No requiere Supabase: simula la RLS con un almacén en memoria que, dado un JWT
 * (verificado con `verifyTenantJwt`), SÓLO devuelve filas cuyo `tenant_id`
 * coincide con el claim — igual que hace Postgres con la política del PoC.
 *
 * Demuestra la garantía del ADR-001: aunque la query "olvide" filtrar por
 * tenant_id (selectAll), la capa RLS impide ver datos de otro tenant, y sin
 * contexto de tenant no se devuelve nada (fail-closed).
 */
import { mintTenantJwt, verifyTenantJwt } from '../jwt'
import { assertTenantContext, MissingTenantContextError } from '../context'
import { resolveDbTarget, type DbTargetRegistry } from '../factory'
import type { TenantRecord } from '../types'

const SECRET = 'test-supabase-jwt-secret-poc'
const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

interface Row { id: number; tenant_id: string; body: string }

/** Almacén que emula RLS: el tenant se toma del JWT, no de la query. */
class RlsStore {
  private rows: Row[] = []
  private seq = 1

  /** Inserta saltando RLS (equivale a un insert con service-role). */
  seed(tenantId: string, body: string): void {
    this.rows.push({ id: this.seq++, tenant_id: tenantId, body })
  }

  /**
   * "select *" bajo RLS: el llamador NO pasa tenant_id; se deriva del JWT.
   * Si el JWT es inválido/ausente, no devuelve nada (fail-closed).
   */
  async selectAll(jwt: string | null): Promise<Row[]> {
    if (!jwt) return []
    let tenantId: string
    try {
      ;({ tenant_id: tenantId } = await verifyTenantJwt(jwt, SECRET))
    } catch {
      return []
    }
    return this.rows.filter((r) => r.tenant_id === tenantId)
  }
}

describe('HU-171 · aislamiento cross-tenant (RLS por claim tenant_id)', () => {
  let store: RlsStore
  beforeEach(() => {
    store = new RlsStore()
    store.seed(TENANT_A, 'nota de A-1')
    store.seed(TENANT_A, 'nota de A-2')
    store.seed(TENANT_B, 'nota de B-1')
  })

  it('un tenant sólo ve sus propias filas (aunque no filtre por tenant_id)', async () => {
    const jwtA = await mintTenantJwt({ userId: 'user-a', tenantId: TENANT_A, secret: SECRET })
    const rows = await store.selectAll(jwtA)
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.tenant_id === TENANT_A)).toBe(true)
    expect(rows.map((r) => r.body)).toEqual(['nota de A-1', 'nota de A-2'])
  })

  it('el tenant B nunca ve datos del tenant A', async () => {
    const jwtB = await mintTenantJwt({ userId: 'user-b', tenantId: TENANT_B, secret: SECRET })
    const rows = await store.selectAll(jwtB)
    expect(rows).toHaveLength(1)
    expect(rows[0].tenant_id).toBe(TENANT_B)
  })

  it('sin JWT no devuelve nada (fail-closed)', async () => {
    expect(await store.selectAll(null)).toHaveLength(0)
  })

  it('un JWT firmado con otro secreto no filtra datos', async () => {
    const forged = await mintTenantJwt({ userId: 'x', tenantId: TENANT_A, secret: 'otro-secreto' })
    expect(await store.selectAll(forged)).toHaveLength(0)
  })
})

describe('HU-171 · JWT con claim tenant_id', () => {
  it('mint/verify preserva sub y tenant_id (rol authenticated por defecto)', async () => {
    const jwt = await mintTenantJwt({ userId: 'user-a', tenantId: TENANT_A, secret: SECRET })
    const claims = await verifyTenantJwt(jwt, SECRET)
    expect(claims.sub).toBe('user-a')
    expect(claims.tenant_id).toBe(TENANT_A)
    expect(claims.role).toBe('authenticated')
  })

  it('mint con rol anon (storefront público) preserva el rol', async () => {
    const jwt = await mintTenantJwt({ userId: 'anon-session', tenantId: TENANT_A, secret: SECRET, role: 'anon' })
    const claims = await verifyTenantJwt(jwt, SECRET)
    expect(claims.role).toBe('anon')
    expect(claims.tenant_id).toBe(TENANT_A)
  })

  it('falla al firmar sin secreto (fail-closed)', async () => {
    await expect(
      mintTenantJwt({ userId: 'u', tenantId: TENANT_A, secret: '' }),
    ).rejects.toThrow(/SUPABASE_JWT_SECRET/)
  })

  it('verify rechaza un token con firma inválida', async () => {
    const jwt = await mintTenantJwt({ userId: 'u', tenantId: TENANT_A, secret: SECRET })
    await expect(verifyTenantJwt(jwt, 'secreto-equivocado')).rejects.toBeDefined()
  })
})

describe('HU-171 · contexto de tenant (fail-closed)', () => {
  it('assertTenantContext devuelve el contexto cuando está completo', () => {
    expect(assertTenantContext({ tenantId: TENANT_A, userId: 'u' })).toEqual({
      tenantId: TENANT_A,
      userId: 'u',
    })
  })

  it('assertTenantContext lanza si falta tenantId o userId', () => {
    expect(() => assertTenantContext(null)).toThrow(MissingTenantContextError)
    expect(() => assertTenantContext({ userId: 'u' })).toThrow(MissingTenantContextError)
    expect(() => assertTenantContext({ tenantId: TENANT_A })).toThrow(MissingTenantContextError)
  })
})

describe('HU-171 · connection factory (routing por db_ref)', () => {
  const registry: DbTargetRegistry = {
    shared: { url: 'https://shared.supabase.co', anonKey: 'anon-shared' },
    dedicated: { 'tenant-a-db': { url: 'https://a.supabase.co', anonKey: 'anon-a' } },
  }

  it('db_ref null/"shared" resuelve al destino compartido', () => {
    const t: TenantRecord = { tenantId: TENANT_A, tier: 'shared', dbRef: null }
    expect(resolveDbTarget(t, registry)).toBe(registry.shared)
    expect(resolveDbTarget({ ...t, dbRef: 'shared' }, registry)).toBe(registry.shared)
  })

  it('db_ref dedicado resuelve a su destino propio', () => {
    const t: TenantRecord = { tenantId: TENANT_A, tier: 'dedicated', dbRef: 'tenant-a-db' }
    expect(resolveDbTarget(t, registry).url).toBe('https://a.supabase.co')
  })

  it('db_ref sin destino registrado lanza (no cae al compartido)', () => {
    const t: TenantRecord = { tenantId: TENANT_B, tier: 'dedicated', dbRef: 'inexistente' }
    expect(() => resolveDbTarget(t, registry)).toThrow(/db_ref sin destino/)
  })
})
