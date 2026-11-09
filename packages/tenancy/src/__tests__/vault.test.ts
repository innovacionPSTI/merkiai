import { createHash, randomBytes } from 'crypto'
import {
  EnvelopeVault,
  InMemoryVault,
  makeSecretResolver,
  type KmsPort,
  type SecretRecord,
  type SecretStore,
} from '../vault'
import { buildDedicatedRegistry } from '../infra-config'
import type { TenantInfraConfig } from '../infra-config'

/**
 * KMS falso para pruebas: la "KEK" cifra la DEK con un XOR determinista por una
 * clave fija. NO es seguro — solo valida el round-trip del envelope sin AWS.
 */
function fakeKms(): KmsPort {
  const kek = createHash('sha256').update('test-kek').digest() // 32 bytes
  const wrap = (buf: Buffer) => Buffer.from(buf.map((b, i) => b ^ kek[i % kek.length]))
  return {
    async generateDataKey() {
      const plaintextKey = randomBytes(32)
      return { plaintextKey, encryptedKey: wrap(plaintextKey) }
    },
    async decrypt(encryptedKey: Buffer) {
      return wrap(encryptedKey) // XOR es su propia inversa
    },
  }
}

/** Store en memoria para pruebas. */
function memStore(): SecretStore & { size: () => number } {
  const m = new Map<string, SecretRecord>()
  return {
    async put(r) { m.set(r.ref, r) },
    async get(ref) { return m.get(ref) ?? null },
    async delete(ref) { m.delete(ref) },
    size: () => m.size,
  }
}

describe('EnvelopeVault (cifrado de sobre)', () => {
  it('round-trip: put → get devuelve el valor original', async () => {
    const vault = new EnvelopeVault(fakeKms(), memStore())
    const ref = await vault.put('anon', 'super-secreto-123')
    expect(ref).toMatch(/^vault:anon:/)
    expect(await vault.get(ref)).toBe('super-secreto-123')
  })

  it('en reposo NO guarda el valor en claro', async () => {
    const store = memStore()
    const vault = new EnvelopeVault(fakeKms(), store)
    const ref = await vault.put('jwt', 'valor-en-claro-xyz')
    const rec = await store.get(ref)
    expect(rec).toBeTruthy()
    const serialized = JSON.stringify(rec)
    expect(serialized).not.toContain('valor-en-claro-xyz')
  })

  it('rotate conserva el ref y cambia el valor', async () => {
    const vault = new EnvelopeVault(fakeKms(), memStore())
    const ref = await vault.put('svc', 'v1')
    await vault.rotate(ref, 'v2')
    expect(await vault.get(ref)).toBe('v2')
  })

  it('fail-closed: get de un ref inexistente lanza', async () => {
    const vault = new EnvelopeVault(fakeKms(), memStore())
    await expect(vault.get('vault:nope:0000')).rejects.toThrow(/no encontrado/)
  })

  it('delete elimina el secreto', async () => {
    const store = memStore()
    const vault = new EnvelopeVault(fakeKms(), store)
    const ref = await vault.put('x', 'y')
    await vault.delete(ref)
    expect(store.size()).toBe(0)
  })
})

describe('InMemoryVault (dev)', () => {
  it('round-trip básico', async () => {
    const vault = new InMemoryVault()
    const ref = await vault.put('a', 'b')
    expect(await vault.get(ref)).toBe('b')
  })
})

describe('makeSecretResolver (cierre del seam vault → factory)', () => {
  const cfg = (over: Partial<TenantInfraConfig> = {}): TenantInfraConfig => ({
    tenantId: 't-1', dbRef: 'ded-1', dbUrl: 'https://ded-1.example.co', status: 'active', ...over,
  })

  it('resuelve anon/service/jwt desde el vault y alimenta buildDedicatedRegistry', async () => {
    const vault = new InMemoryVault()
    const anon = await vault.put('anon', 'ANON-1')
    const svc = await vault.put('svc', 'SVC-1')
    const jwt = await vault.put('jwt', 'JWT-1')
    const resolver = makeSecretResolver(vault)

    const reg = await buildDedicatedRegistry(
      [cfg({ secretRefAnonKey: anon, secretRefServiceKey: svc, secretRefJwtSecret: jwt })],
      resolver,
    )
    expect(reg['ded-1']).toEqual({
      url: 'https://ded-1.example.co', anonKey: 'ANON-1', serviceKey: 'SVC-1', jwtSecret: 'JWT-1',
    })
  })

  it('service/jwt son opcionales', async () => {
    const vault = new InMemoryVault()
    const anon = await vault.put('anon', 'ONLY-ANON')
    const resolver = makeSecretResolver(vault)
    const secrets = await resolver(cfg({ secretRefAnonKey: anon }))
    expect(secrets).toEqual({ anonKey: 'ONLY-ANON', serviceKey: undefined, jwtSecret: undefined })
  })

  it('fail-closed: sin secret_ref_anon_key lanza', async () => {
    const resolver = makeSecretResolver(new InMemoryVault())
    await expect(resolver(cfg())).rejects.toThrow(/sin secret_ref_anon_key/)
  })
})
