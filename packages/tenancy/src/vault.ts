/**
 * @merkiai/tenancy — Custodia de secretos (HU-362 · ADR-007 §4).
 *
 * Contrato `SecretsVault` + adaptadores. El **cifrado de sobre** (envelope) es
 * agnóstico del proveedor: la cripta de datos usa AES-256-GCM (node:crypto) con
 * una DEK por secreto, y la DEK se protege con un **KMS** detrás del puerto
 * `KmsPort` (el adaptador real de AWS KMS se inyecta en Fase 2b; aquí es testeable
 * con un fake). El almacenamiento del ciphertext va detrás de `SecretStore`
 * (tabla de plataforma en Fase 2b; en memoria para pruebas).
 *
 * Fail-closed: cualquier fallo de cifrado/descifrado PROPAGA (no devuelve vacío).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import type { SecretResolver, TenantInfraConfig, DedicatedSecrets } from './infra-config'

/** Contrato de custodia de secretos. `ref` es un token opaco (no el valor). */
export interface SecretsVault {
  /** Descifra y devuelve el valor del secreto referenciado. */
  get(ref: string): Promise<string>
  /** Guarda un valor cifrado y devuelve su `ref`. */
  put(name: string, value: string): Promise<string>
  /** Rota el valor de un `ref` existente (re-cifra), conservando el `ref`. */
  rotate(ref: string, newValue: string): Promise<void>
  /** Elimina el secreto referenciado. */
  delete(ref: string): Promise<void>
}

// ─── Envelope (AES-256-GCM + KMS por puerto) ─────────────────────────────────

/**
 * Puerto del KMS para el cifrado de sobre. Lo implementa el adaptador real de
 * AWS KMS (Fase 2b) o un fake en pruebas. `generateDataKey` devuelve la DEK en
 * claro (solo en memoria) + su versión cifrada por la KEK; `decrypt` recupera la
 * DEK en claro a partir de la cifrada.
 */
export interface KmsPort {
  generateDataKey(): Promise<{ plaintextKey: Buffer; encryptedKey: Buffer }>
  decrypt(encryptedKey: Buffer): Promise<Buffer>
}

/** Registro cifrado que persiste el `SecretStore` (nada en claro). */
export interface SecretRecord {
  ref: string
  name: string
  encryptedKey: string // base64 (DEK cifrada por la KEK del KMS)
  iv: string // base64
  authTag: string // base64
  ciphertext: string // base64 (valor cifrado con la DEK)
}

/** Almacén del ciphertext (tabla de plataforma en Fase 2b; en memoria en tests). */
export interface SecretStore {
  put(record: SecretRecord): Promise<void>
  get(ref: string): Promise<SecretRecord | null>
  delete(ref: string): Promise<void>
}

const ALG = 'aes-256-gcm'

/** Genera un `ref` opaco (no adivinable). */
function newRef(name: string): string {
  return `vault:${name}:${randomBytes(12).toString('hex')}`
}

/**
 * Vault de cifrado de sobre. La DEK vive solo en memoria durante la operación;
 * en reposo se guarda la DEK **cifrada** + el valor cifrado con esa DEK.
 */
export class EnvelopeVault implements SecretsVault {
  constructor(
    private readonly kms: KmsPort,
    private readonly store: SecretStore,
  ) {}

  private async encrypt(name: string, ref: string, value: string): Promise<SecretRecord> {
    const { plaintextKey, encryptedKey } = await this.kms.generateDataKey()
    if (plaintextKey.length !== 32) throw new Error('[vault] la DEK debe ser de 256 bits (32 bytes)')
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALG, plaintextKey, iv)
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    plaintextKey.fill(0) // higiene: borra la DEK en claro de memoria
    return {
      ref, name,
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    }
  }

  async get(ref: string): Promise<string> {
    const rec = await this.store.get(ref)
    if (!rec) throw new Error(`[vault] secreto no encontrado: ${ref}`)
    const dek = await this.kms.decrypt(Buffer.from(rec.encryptedKey, 'base64'))
    try {
      const decipher = createDecipheriv(ALG, dek, Buffer.from(rec.iv, 'base64'))
      decipher.setAuthTag(Buffer.from(rec.authTag, 'base64'))
      const plain = Buffer.concat([decipher.update(Buffer.from(rec.ciphertext, 'base64')), decipher.final()])
      return plain.toString('utf8')
    } finally {
      dek.fill(0)
    }
  }

  async put(name: string, value: string): Promise<string> {
    const ref = newRef(name)
    await this.store.put(await this.encrypt(name, ref, value))
    return ref
  }

  async rotate(ref: string, newValue: string): Promise<void> {
    const existing = await this.store.get(ref)
    if (!existing) throw new Error(`[vault] no se puede rotar un secreto inexistente: ${ref}`)
    await this.store.put(await this.encrypt(existing.name, ref, newValue))
  }

  async delete(ref: string): Promise<void> {
    await this.store.delete(ref)
  }
}

// ─── InMemoryVault (solo desarrollo/pruebas) ─────────────────────────────────

/**
 * Vault en memoria, SIN cifrado real. SOLO para desarrollo/pruebas locales;
 * nunca en producción (no persiste ni protege). Útil como fallback del seam.
 */
export class InMemoryVault implements SecretsVault {
  private readonly map = new Map<string, string>()
  async get(ref: string): Promise<string> {
    const v = this.map.get(ref)
    if (v === undefined) throw new Error(`[vault] secreto no encontrado: ${ref}`)
    return v
  }
  async put(name: string, value: string): Promise<string> {
    const ref = newRef(name)
    this.map.set(ref, value)
    return ref
  }
  async rotate(ref: string, newValue: string): Promise<void> {
    if (!this.map.has(ref)) throw new Error(`[vault] no se puede rotar un secreto inexistente: ${ref}`)
    this.map.set(ref, newValue)
  }
  async delete(ref: string): Promise<void> {
    this.map.delete(ref)
  }
}

// ─── Cierre del seam: SecretsVault → SecretResolver ──────────────────────────

/**
 * Adapta un `SecretsVault` al `SecretResolver` que consume el connection factory
 * (infra-config.ts): resuelve los `secret_ref_*` de un tenant en sus secretos.
 * Fail-closed: exige `secretRefAnonKey` (sin anonKey no hay destino utilizable).
 */
export function makeSecretResolver(vault: SecretsVault): SecretResolver {
  return async (cfg: TenantInfraConfig): Promise<DedicatedSecrets> => {
    if (!cfg.secretRefAnonKey) {
      throw new Error(`[vault] tenant_infra_config sin secret_ref_anon_key (tenant ${cfg.tenantId}, db_ref ${cfg.dbRef})`)
    }
    const [anonKey, serviceKey, jwtSecret] = await Promise.all([
      vault.get(cfg.secretRefAnonKey),
      cfg.secretRefServiceKey ? vault.get(cfg.secretRefServiceKey) : Promise.resolve(undefined),
      cfg.secretRefJwtSecret ? vault.get(cfg.secretRefJwtSecret) : Promise.resolve(undefined),
    ])
    return { anonKey, serviceKey, jwtSecret }
  }
}
