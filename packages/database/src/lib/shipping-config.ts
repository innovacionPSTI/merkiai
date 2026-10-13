/**
 * Resolución de las CREDENCIALES de la transportadora activa (ADR-004 · HU-278).
 *
 * Las credenciales del carrier (Skydropx) viven en la instancia de envío activa;
 * los AJUSTES globales (tarifa fija, envío gratis, dirección de origen) siguen en
 * shipping_config. Fallback legacy a las columnas skydropx_* de shipping_config.
 */
import type { Db } from '../client'
import { getActiveInstance } from '../queries/integration-instances'
import { getShippingConfig } from '../queries/shipping-config'

export interface ResolvedShippingCreds {
  provider: string
  clientId: string
  clientSecret: string
  baseUrl?: string
  addressFromId?: string
  /** Clave secreta HMAC para verificar la firma de los webhooks (recomendado). */
  webhookSecret?: string
  /** Token estático para autenticar los webhooks (Authorization: Bearer). */
  webhookToken?: string
}

export async function resolveShippingCreds(db: Db, tenantId: string): Promise<ResolvedShippingCreds | null> {
  const inst = await getActiveInstance(db, tenantId, 'shipping').catch(() => null)
  const c = (inst?.credentials ?? {}) as Record<string, string | undefined>
  const s = (inst?.settings ?? {}) as Record<string, unknown>
  if (inst && inst.enabled && inst.provider === 'skydropx' && c.client_id && c.client_secret) {
    return { provider: 'skydropx', clientId: c.client_id, clientSecret: c.client_secret, baseUrl: (s.base_url as string | undefined) ?? undefined, addressFromId: c.address_from_id, webhookSecret: c.webhook_secret, webhookToken: c.webhook_token }
  }
  // Legacy: columnas de shipping_config.
  const cfg = await getShippingConfig(db, tenantId).catch(() => null)
  if (cfg?.skydropx_client_id && cfg?.skydropx_client_secret) {
    return { provider: 'skydropx', clientId: cfg.skydropx_client_id, clientSecret: cfg.skydropx_client_secret, baseUrl: cfg.skydropx_base_url ?? undefined, addressFromId: cfg.skydropx_address_from_id ?? undefined }
  }
  return null
}
