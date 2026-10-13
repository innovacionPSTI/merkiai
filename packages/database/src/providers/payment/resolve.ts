/**
 * Resolución de la pasarela ACTIVA de un tenant (ADR-004 · HU-277).
 *
 * Fuente de verdad del runtime (checkout/webhooks/reconcile): la INSTANCIA activa
 * (integration_instances). Si no hay instancias (aún no migrado), cae al LEGACY
 * payment_config. Devuelve credenciales genéricas (claves del registry) para
 * construir el gateway con `gatewayFromInstance`.
 */
import type { Db } from '../../client'
import { getActiveInstance } from '../../queries/integration-instances'
import { getPaymentConfig } from '../../queries/payment-config'
import { getActiveProvider, legacyCredentials } from './index'
import { getProviderDef } from '../registry'
import type { IntegrationEnv, IntegrationKind } from '../../queries/integration-instances'

export interface ActivePayment {
  provider: string
  environment: IntegrationEnv | 'unknown'
  credentials: Record<string, string | undefined>
  settings: Record<string, unknown>
  source: 'instance' | 'legacy'
}

/**
 * Resolución GENÉRICA de la instancia activa de cualquier tipo (pago/envío/
 * correo). Sin fallback legacy (cada tipo añade el suyo cuando se hace su
 * cutover). Devuelve null si no hay instancia activa.
 */
export async function resolveActiveInstance(db: Db, tenantId: string, kind: IntegrationKind): Promise<ActivePayment | null> {
  const inst = await getActiveInstance(db, tenantId, kind).catch(() => null)
  if (inst && inst.enabled) {
    return {
      provider: inst.provider,
      environment: inst.environment,
      credentials: inst.credentials as Record<string, string | undefined>,
      settings: inst.settings,
      source: 'instance',
    }
  }
  return null
}

export async function resolveActivePayment(db: Db, tenantId: string): Promise<ActivePayment | null> {
  // 1) Instancia activa (modelo nuevo).
  const inst = await getActiveInstance(db, tenantId, 'payment').catch(() => null)
  if (inst && inst.enabled) {
    return {
      provider: inst.provider,
      environment: inst.environment,
      credentials: inst.credentials as Record<string, string | undefined>,
      settings: inst.settings,
      source: 'instance',
    }
  }

  // 2) Legacy: payment_config (hasta que se complete el backfill/cutover).
  const cfg = await getPaymentConfig(db, tenantId).catch(() => null)
  if (!cfg) return null
  const active = getActiveProvider(cfg)
  if (active === 'none') return null
  const { credentials, settings } = legacyCredentials(active, cfg)
  const def = getProviderDef('payment', active)
  const environment = def ? def.detectEnv(credentials, settings) : 'unknown'
  return { provider: active, environment, credentials, settings, source: 'legacy' }
}
