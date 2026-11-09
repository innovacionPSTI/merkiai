/**
 * Ensamblaje del vault en el CONSOLE (HU-362 · ADR-007). Único lugar donde se
 * compone el `SecretsVault`: KMS real (AWS) + `SecretStore` sobre la BD de
 * plataforma. web/admin NO montan vault; piden el destino resuelto a la API
 * interna `resolve-tenant`.
 *
 * Selección de adaptador:
 *  - Si hay `MERKIAI_VAULT_KEY_ALIAS` (KMS configurado) → `EnvelopeVault` real.
 *  - Si no, y NO es producción → `InMemoryVault` (solo dev/local).
 *  - Si no, y es producción → lanza (fail-closed: no servir dedicado sin vault).
 */
import { EnvelopeVault, InMemoryVault, makeSecretResolver } from '@merkiai/tenancy'
import type { SecretsVault, SecretResolver } from '@merkiai/tenancy'
import { platformDb } from './platform-db'
import { makePlatformSecretStore, type SecretStoreDb } from './secret-store'
import { createAwsKmsPort, kmsConfigFromEnv } from './kms-port'

let cached: SecretsVault | null = null

/** Devuelve el `SecretsVault` del console (memoizado por proceso). */
export function getSecretsVault(): SecretsVault {
  if (cached) return cached
  const cfg = kmsConfigFromEnv()
  if (cfg) {
    const store = makePlatformSecretStore(platformDb() as unknown as SecretStoreDb)
    cached = new EnvelopeVault(createAwsKmsPort(cfg), store)
    return cached
  }
  if (process.env.NODE_ENV !== 'production') {
    cached = new InMemoryVault()
    return cached
  }
  throw new Error('[vault] no configurado: falta MERKIAI_VAULT_KEY_ALIAS (AWS KMS) en producción')
}

/** `SecretResolver` listo para `buildDedicatedRegistry` / resolución por tenant. */
export function getSecretResolver(): SecretResolver {
  return makeSecretResolver(getSecretsVault())
}
