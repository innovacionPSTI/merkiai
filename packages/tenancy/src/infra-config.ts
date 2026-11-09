/**
 * @merkiai/tenancy — Config de infra por-tenant dedicado (HU-361 · ADR-007).
 *
 * Capa PURA: arma el registro de destinos dedicados (`DbTargetRegistry.dedicated`)
 * a partir de la config de plataforma (`tenant_infra_config`) + un resolutor de
 * secretos inyectado (el **seam del vault**). No habla con la BD ni con AWS: el
 * control plane le pasa las filas ya leídas y el adaptador de vault.
 *
 * Separación de responsabilidades (ADR-007):
 *  - Esta capa compone la config NO secreta.
 *  - Los secretos (anon/service/jwt) los entrega el `SecretResolver` (vault, HU-362).
 *  - En Fase 1 (sin vault), se usa `vaultPendingResolver` → fail-closed explícito.
 */
import type { DbTarget, DbTargetRegistry } from './factory'

/** Estado del registro de config de infra de un tenant. */
export type InfraConfigStatus = 'draft' | 'active' | 'rotating' | 'disabled'

/**
 * Fila de `tenant_infra_config` (BD de plataforma). Solo config NO secreta +
 * referencias (`secretRef*`) al material secreto que resuelve el vault.
 */
export interface TenantInfraConfig {
  tenantId: string
  dbRef: string
  dbUrl: string
  baseUrl?: string | null
  sentryDsn?: string | null
  region?: string | null
  secretRefAnonKey?: string | null
  secretRefServiceKey?: string | null
  secretRefJwtSecret?: string | null
  status: InfraConfigStatus
}

/** Material secreto resuelto de un destino dedicado (vía vault). */
export interface DedicatedSecrets {
  anonKey: string
  serviceKey?: string
  jwtSecret?: string
}

/**
 * Seam del vault: dado un registro de infra, devuelve sus secretos resueltos.
 * Lo implementa el adaptador de vault (AWS KMS, HU-362). Async porque descifrar
 * es una llamada de red/cripto.
 */
export type SecretResolver = (cfg: TenantInfraConfig) => Promise<DedicatedSecrets>

/** `db_ref` reservado del destino compartido; nunca es un destino dedicado. */
export const SHARED_DB_REF = 'shared'

/** Un registro cuenta como utilizable solo si está `active`. */
export function isActiveInfraConfig(cfg: TenantInfraConfig): boolean {
  return cfg.status === 'active'
}

/**
 * Valida la coherencia mínima de una fila de config (fail-closed en el borde).
 * Lanza si falta `dbUrl`/`dbRef` o si `dbRef` es el reservado 'shared'.
 */
export function assertInfraConfig(cfg: TenantInfraConfig): void {
  if (!cfg.dbRef || cfg.dbRef === SHARED_DB_REF) {
    throw new Error(`[tenancy] tenant_infra_config.db_ref inválido: "${cfg.dbRef}" (tenant ${cfg.tenantId})`)
  }
  if (!cfg.dbUrl) {
    throw new Error(`[tenancy] tenant_infra_config sin db_url (tenant ${cfg.tenantId}, db_ref ${cfg.dbRef})`)
  }
}

/**
 * Resolutor de secretos de Fase 1 (sin vault): **siempre lanza**. Mantiene el
 * sistema fail-closed hasta que HU-362 cablee el adaptador real (AWS KMS). Así
 * un destino dedicado no se puede resolver a medias (sin anonKey) por accidente.
 */
export const vaultPendingResolver: SecretResolver = async (cfg) => {
  throw new Error(
    `[tenancy] resolución de secretos por vault pendiente (HU-362): no se puede materializar el destino dedicado "${cfg.dbRef}" (tenant ${cfg.tenantId})`,
  )
}

/**
 * Compone un `DbTarget` a partir de la config no secreta + sus secretos resueltos.
 * Puro. `assertInfraConfig` ya debió pasar.
 */
export function toDbTarget(cfg: TenantInfraConfig, secrets: DedicatedSecrets): DbTarget {
  if (!secrets.anonKey) {
    throw new Error(`[tenancy] destino dedicado "${cfg.dbRef}" sin anonKey resuelto (tenant ${cfg.tenantId})`)
  }
  return {
    url: cfg.dbUrl,
    anonKey: secrets.anonKey,
    serviceKey: secrets.serviceKey,
    jwtSecret: secrets.jwtSecret,
  }
}

/**
 * Arma el mapa `dedicated` del `DbTargetRegistry` a partir de las filas de
 * `tenant_infra_config` **activas**, resolviendo los secretos de cada una con el
 * `SecretResolver` inyectado. Las filas no activas se omiten.
 *
 * Fail-closed: si una fila activa es incoherente o su resolución de secretos
 * falla, **propaga el error** (no deja un destino a medias ni cae al compartido).
 */
export async function buildDedicatedRegistry(
  rows: readonly TenantInfraConfig[],
  resolveSecrets: SecretResolver,
): Promise<Record<string, DbTarget>> {
  const dedicated: Record<string, DbTarget> = {}
  for (const cfg of rows) {
    if (!isActiveInfraConfig(cfg)) continue
    assertInfraConfig(cfg)
    if (dedicated[cfg.dbRef]) {
      throw new Error(`[tenancy] db_ref duplicado en tenant_infra_config: "${cfg.dbRef}"`)
    }
    const secrets = await resolveSecrets(cfg)
    dedicated[cfg.dbRef] = toDbTarget(cfg, secrets)
  }
  return dedicated
}

/**
 * Conveniencia: arma el `DbTargetRegistry` completo (compartido desde env +
 * dedicados desde plataforma/vault). El `shared` lo provee el llamador.
 */
export async function buildDbTargetRegistry(
  shared: DbTarget,
  rows: readonly TenantInfraConfig[],
  resolveSecrets: SecretResolver,
): Promise<DbTargetRegistry> {
  const dedicated = await buildDedicatedRegistry(rows, resolveSecrets)
  return { shared, dedicated }
}
