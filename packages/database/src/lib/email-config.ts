/**
 * Resolución de la configuración de correo ACTIVA de un tenant (ADR-004 · HU-278).
 *
 * Fuente de verdad: la INSTANCIA de correo activa (integration_instances). Si no
 * hay, cae al LEGACY store_config (resend_api_key/resend_from_email). El
 * `storeName` siempre sale de store_config (no es por-instancia).
 */
import type { Db } from '../client'
import { getActiveInstance } from '../queries/integration-instances'
import { getStoreConfig } from '../queries/store-config'

export interface ResolvedEmailConfig {
  apiKey: string
  fromEmail: string
  storeName?: string
  provider: string
}

export async function resolveEmailConfig(db: Db, tenantId: string): Promise<ResolvedEmailConfig | null> {
  const store = await getStoreConfig(db, tenantId).catch(() => null)
  const storeName = store?.store_name ?? undefined

  const inst = await getActiveInstance(db, tenantId, 'email').catch(() => null)
  const creds = (inst?.credentials ?? {}) as Record<string, string | undefined>
  if (inst && inst.enabled && creds.api_key && creds.from_email) {
    return { apiKey: creds.api_key, fromEmail: creds.from_email, storeName, provider: inst.provider }
  }

  // Legacy: store_config.
  if (store?.resend_api_key && store?.resend_from_email) {
    return { apiKey: store.resend_api_key, fromEmail: store.resend_from_email, storeName, provider: store.email_provider ?? 'resend' }
  }
  return null
}
