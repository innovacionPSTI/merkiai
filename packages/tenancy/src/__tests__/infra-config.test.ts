import {
  assertInfraConfig,
  buildDedicatedRegistry,
  buildDbTargetRegistry,
  isActiveInfraConfig,
  toDbTarget,
  vaultPendingResolver,
  type SecretResolver,
  type TenantInfraConfig,
} from '../infra-config'
import { resolveDbTarget, type DbTarget } from '../factory'

const base = (over: Partial<TenantInfraConfig> = {}): TenantInfraConfig => {
  const dbRef = over.dbRef ?? 'ded-1'
  return {
    tenantId: 't-1',
    dbRef,
    dbUrl: `https://${dbRef}.example.co`,
    status: 'active',
    ...over,
  }
}

const fakeResolver: SecretResolver = async (cfg) => ({
  anonKey: `anon-${cfg.dbRef}`,
  serviceKey: `svc-${cfg.dbRef}`,
  jwtSecret: `jwt-${cfg.dbRef}`,
})

describe('isActiveInfraConfig', () => {
  it('solo activa cuenta como utilizable', () => {
    expect(isActiveInfraConfig(base({ status: 'active' }))).toBe(true)
    for (const s of ['draft', 'rotating', 'disabled'] as const) {
      expect(isActiveInfraConfig(base({ status: s }))).toBe(false)
    }
  })
})

describe('assertInfraConfig', () => {
  it('acepta config coherente', () => {
    expect(() => assertInfraConfig(base())).not.toThrow()
  })
  it('rechaza db_ref vacío o "shared"', () => {
    expect(() => assertInfraConfig(base({ dbRef: '' }))).toThrow(/db_ref inválido/)
    expect(() => assertInfraConfig(base({ dbRef: 'shared' }))).toThrow(/db_ref inválido/)
  })
  it('rechaza db_url ausente', () => {
    expect(() => assertInfraConfig(base({ dbUrl: '' }))).toThrow(/sin db_url/)
  })
})

describe('toDbTarget', () => {
  it('compone url + secretos resueltos', () => {
    const t = toDbTarget(base(), { anonKey: 'a', serviceKey: 's', jwtSecret: 'j' })
    expect(t).toEqual({ url: 'https://ded-1.example.co', anonKey: 'a', serviceKey: 's', jwtSecret: 'j' })
  })
  it('exige anonKey', () => {
    expect(() => toDbTarget(base(), { anonKey: '' })).toThrow(/sin anonKey/)
  })
})

describe('buildDedicatedRegistry', () => {
  it('arma solo las filas activas, resolviendo secretos', async () => {
    const rows = [
      base({ dbRef: 'ded-1' }),
      base({ dbRef: 'ded-2', status: 'draft' }), // omitida
      base({ dbRef: 'ded-3' }),
    ]
    const reg = await buildDedicatedRegistry(rows, fakeResolver)
    expect(Object.keys(reg).sort()).toEqual(['ded-1', 'ded-3'])
    expect(reg['ded-1']).toEqual({
      url: 'https://ded-1.example.co', anonKey: 'anon-ded-1', serviceKey: 'svc-ded-1', jwtSecret: 'jwt-ded-1',
    })
  })

  it('fail-closed: propaga si el resolver de secretos falla', async () => {
    await expect(buildDedicatedRegistry([base()], vaultPendingResolver)).rejects.toThrow(/vault pendiente \(HU-362\)/)
  })

  it('fail-closed: rechaza db_ref duplicado', async () => {
    const rows = [base({ dbRef: 'dup' }), base({ tenantId: 't-2', dbRef: 'dup' })]
    await expect(buildDedicatedRegistry(rows, fakeResolver)).rejects.toThrow(/db_ref duplicado/)
  })

  it('ignora por completo las filas no activas (no llama al resolver)', async () => {
    const resolver = jest.fn(fakeResolver)
    const reg = await buildDedicatedRegistry([base({ status: 'disabled' })], resolver)
    expect(reg).toEqual({})
    expect(resolver).not.toHaveBeenCalled()
  })
})

describe('buildDbTargetRegistry + resolveDbTarget (integración de la costura)', () => {
  const shared: DbTarget = { url: 'https://shared.example.co', anonKey: 'shared-anon' }

  it('shared/null resuelve al compartido; dedicado resuelve al suyo', async () => {
    const reg = await buildDbTargetRegistry(shared, [base({ dbRef: 'ded-9' })], fakeResolver)
    expect(resolveDbTarget({ tenantId: 't', tier: 'shared', dbRef: null }, reg)).toBe(shared)
    expect(resolveDbTarget({ tenantId: 't', tier: 'shared', dbRef: 'shared' }, reg)).toBe(shared)
    expect(resolveDbTarget({ tenantId: 't', tier: 'dedicated', dbRef: 'ded-9' }, reg).url)
      .toBe('https://ded-9.example.co')
  })

  it('un db_ref dedicado inexistente en el registro lanza (fail-closed del factory)', async () => {
    const reg = await buildDbTargetRegistry(shared, [], fakeResolver)
    expect(() => resolveDbTarget({ tenantId: 't', tier: 'dedicated', dbRef: 'no-existe' }, reg))
      .toThrow(/sin destino registrado/)
  })
})
