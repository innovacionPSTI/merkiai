import { createHash, randomBytes } from 'crypto'
import { EnvelopeVault, type KmsPort } from '@merkiai/tenancy'
import {
  makePlatformSecretStore,
  recordToRow,
  rowToRecord,
  type PlatformSecretRow,
  type SecretStoreDb,
} from '../secret-store'

const sampleRow: PlatformSecretRow = {
  ref: 'vault:anon:abc', name: 'anon', encrypted_key: 'EK', iv: 'IV', auth_tag: 'AT', ciphertext: 'CT',
}

describe('mappers fila↔registro', () => {
  it('recordToRow / rowToRecord son inversos', () => {
    expect(recordToRow(rowToRecord(sampleRow))).toEqual(sampleRow)
    const rec = rowToRecord(sampleRow)
    expect(rec).toEqual({ ref: 'vault:anon:abc', name: 'anon', encryptedKey: 'EK', iv: 'IV', authTag: 'AT', ciphertext: 'CT' })
  })
})

/** BD fake en memoria que cumple el contrato SecretStoreDb. */
function fakeDb(): SecretStoreDb & { rows: Map<string, PlatformSecretRow> } {
  const rows = new Map<string, PlatformSecretRow>()
  return {
    rows,
    from() {
      return {
        async upsert(values: PlatformSecretRow & { updated_at: string }) {
          const { updated_at: _u, ...row } = values
          rows.set(row.ref, row)
          return { error: null }
        },
        select() {
          return {
            eq(_col: string, val: string) {
              return { async maybeSingle() { return { data: rows.get(val) ?? null, error: null } } }
            },
          }
        },
        delete() {
          return { async eq(_col: string, val: string) { rows.delete(val); return { error: null } } }
        },
      }
    },
  }
}

function fakeKms(): KmsPort {
  const kek = createHash('sha256').update('k').digest()
  const wrap = (b: Buffer) => Buffer.from(b.map((x, i) => x ^ kek[i % kek.length]))
  return {
    async generateDataKey() { const k = randomBytes(32); return { plaintextKey: k, encryptedKey: wrap(k) } },
    async decrypt(ek: Buffer) { return wrap(ek) },
  }
}

describe('makePlatformSecretStore + EnvelopeVault (round-trip con BD fake)', () => {
  it('cifra, persiste SOLO ciphertext y descifra de vuelta', async () => {
    const db = fakeDb()
    const vault = new EnvelopeVault(fakeKms(), makePlatformSecretStore(db))

    const ref = await vault.put('jwt', 'secreto-del-tenant')
    // Persistido y NADA en claro en la "BD".
    expect(db.rows.has(ref)).toBe(true)
    expect(JSON.stringify([...db.rows.values()])).not.toContain('secreto-del-tenant')
    // Se recupera el valor original.
    expect(await vault.get(ref)).toBe('secreto-del-tenant')
  })

  it('delete borra la fila', async () => {
    const db = fakeDb()
    const vault = new EnvelopeVault(fakeKms(), makePlatformSecretStore(db))
    const ref = await vault.put('x', 'y')
    await vault.delete(ref)
    expect(db.rows.size).toBe(0)
  })
})
