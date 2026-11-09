/**
 * Adaptador real de `KmsPort` sobre **AWS KMS** (HU-362 · ADR-007 §4.1). Solo lo
 * usa el CONSOLE (control plane). Implementa el cifrado de sobre delegando en KMS:
 *  - `generateDataKey`: pide a KMS una DEK de 256 bits (en claro + cifrada por la KEK).
 *  - `decrypt`: recupera la DEK en claro a partir de la cifrada.
 *
 * El SDK de AWS se carga con **import dinámico por especificador variable** para
 * que el paquete compile aunque `@aws-sdk/client-kms` no esté instalado todavía
 * (se agrega como dependencia; en runtime debe estar). Credenciales: las toma el
 * SDK del entorno (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`) — el
 * root of trust vive en la env del console (nunca en el vault).
 */
import type { KmsPort } from '@merkiai/tenancy'

const KMS_PKG = '@aws-sdk/client-kms'

/** Config del adaptador (del entorno del console). */
export interface KmsPortConfig {
  /** Alias o ARN de la KEK, p. ej. `alias/merkiai-prod-tenant-secrets`. */
  keyId: string
  region?: string
}

/** Lee la config del entorno; `null` si no está configurada (fail-closed arriba). */
export function kmsConfigFromEnv(): KmsPortConfig | null {
  const keyId = process.env.MERKIAI_VAULT_KEY_ALIAS
  if (!keyId) return null
  return { keyId, region: process.env.AWS_REGION }
}

/**
 * Crea el `KmsPort` real. Carga el SDK bajo demanda (import dinámico) y reutiliza
 * un único cliente. Lanza si el SDK no está instalado o la DEK no es de 256 bits.
 */
export function createAwsKmsPort(config: KmsPortConfig): KmsPort {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientPromise: Promise<any> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mod: any = null

  async function load() {
    if (!clientPromise) {
      clientPromise = (async () => {
        mod = await import(/* @vite-ignore */ KMS_PKG as string).catch(() => {
          throw new Error(`[kms] falta la dependencia ${KMS_PKG}. Instálala en apps/console.`)
        })
        return new mod.KMSClient({ region: config.region })
      })()
    }
    return clientPromise
  }

  return {
    async generateDataKey() {
      const client = await load()
      const out = await client.send(new mod.GenerateDataKeyCommand({ KeyId: config.keyId, KeySpec: 'AES_256' }))
      const plaintextKey = Buffer.from(out.Plaintext as Uint8Array)
      const encryptedKey = Buffer.from(out.CiphertextBlob as Uint8Array)
      if (plaintextKey.length !== 32) throw new Error('[kms] DEK inesperada (no 256 bits)')
      return { plaintextKey, encryptedKey }
    },
    async decrypt(encryptedKey: Buffer) {
      const client = await load()
      const out = await client.send(new mod.DecryptCommand({ CiphertextBlob: encryptedKey, KeyId: config.keyId }))
      return Buffer.from(out.Plaintext as Uint8Array)
    },
  }
}
