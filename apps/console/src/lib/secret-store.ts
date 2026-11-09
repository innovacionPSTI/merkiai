/**
 * SecretStore respaldado por la BD de PLATAFORMA (tabla `platform_secrets`),
 * para el EnvelopeVault (HU-362 · ADR-007). Guarda SOLO material cifrado.
 *
 * El cliente de BD se inyecta (como el resto del control plane usa `platformDb`),
 * de modo que el mapeo fila↔registro queda testeable sin red.
 */
import type { SecretRecord, SecretStore } from '@merkiai/tenancy'

/** Forma de la fila en `platform_secrets` (snake_case). */
export interface PlatformSecretRow {
  ref: string
  name: string
  encrypted_key: string
  iv: string
  auth_tag: string
  ciphertext: string
}

/** Mapea el registro del vault (camelCase) a la fila de BD (snake_case). PURO. */
export function recordToRow(r: SecretRecord): PlatformSecretRow {
  return {
    ref: r.ref,
    name: r.name,
    encrypted_key: r.encryptedKey,
    iv: r.iv,
    auth_tag: r.authTag,
    ciphertext: r.ciphertext,
  }
}

/** Mapea la fila de BD al registro del vault. PURO. */
export function rowToRecord(row: PlatformSecretRow): SecretRecord {
  return {
    ref: row.ref,
    name: row.name,
    encryptedKey: row.encrypted_key,
    iv: row.iv,
    authTag: row.auth_tag,
    ciphertext: row.ciphertext,
  }
}

/** Contrato mínimo del cliente de BD que necesita el store (subconjunto de Supabase). */
export interface SecretStoreDb {
  from(table: string): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert(values: any, opts?: any): Promise<{ error: { message: string } | null }>
    select(cols: string): {
      eq(col: string, val: string): {
        maybeSingle(): Promise<{ data: PlatformSecretRow | null; error: { message: string } | null }>
      }
    }
    delete(): { eq(col: string, val: string): Promise<{ error: { message: string } | null }> }
  }
}

const TABLE = 'platform_secrets'

/** Crea un SecretStore sobre la BD de plataforma inyectada. */
export function makePlatformSecretStore(db: SecretStoreDb): SecretStore {
  return {
    async put(record: SecretRecord): Promise<void> {
      const { error } = await db.from(TABLE).upsert(
        { ...recordToRow(record), updated_at: new Date().toISOString() },
        { onConflict: 'ref' },
      )
      if (error) throw new Error(`[secret-store] put falló: ${error.message}`)
    },
    async get(ref: string): Promise<SecretRecord | null> {
      const { data, error } = await db.from(TABLE)
        .select('ref, name, encrypted_key, iv, auth_tag, ciphertext')
        .eq('ref', ref)
        .maybeSingle()
      if (error) throw new Error(`[secret-store] get falló: ${error.message}`)
      return data ? rowToRecord(data) : null
    },
    async delete(ref: string): Promise<void> {
      const { error } = await db.from(TABLE).delete().eq('ref', ref)
      if (error) throw new Error(`[secret-store] delete falló: ${error.message}`)
    },
  }
}
