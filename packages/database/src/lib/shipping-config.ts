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
  /** Entorno de la cuenta (decide el host del API). */
  environment?: 'test' | 'production'
  baseUrl?: string
  addressFromId?: string
  /** Clave secreta HMAC para verificar la firma de los webhooks (recomendado). */
  webhookSecret?: string
  /** Token estático para autenticar los webhooks (Authorization: Bearer). */
  webhookToken?: string
}

/** Un base_url de dashboard (no del API) debe ignorarse; el host del API se deriva del entorno. */
function cleanApiBase(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/app\.skydropx\.com|\/users\/|merchant_stores/i.test(url)) return undefined
  return url
}

export async function resolveShippingCreds(db: Db, tenantId: string): Promise<ResolvedShippingCreds | null> {
  const inst = await getActiveInstance(db, tenantId, 'shipping').catch(() => null)
  const c = (inst?.credentials ?? {}) as Record<string, string | undefined>
  const s = (inst?.settings ?? {}) as Record<string, unknown>
  if (inst && inst.enabled && inst.provider === 'skydropx' && c.client_id && c.client_secret) {
    return {
      provider: 'skydropx', clientId: c.client_id, clientSecret: c.client_secret,
      environment: inst.environment === 'production' ? 'production' : 'test',
      baseUrl: cleanApiBase(s.base_url as string | undefined),
      addressFromId: c.address_from_id, webhookSecret: c.webhook_secret, webhookToken: c.webhook_token,
    }
  }
  // Legacy: columnas de shipping_config.
  const cfg = await getShippingConfig(db, tenantId).catch(() => null)
  if (cfg?.skydropx_client_id && cfg?.skydropx_client_secret) {
    const legacyEnv = /sandbox|demo|sb-pro/i.test(cfg.skydropx_base_url ?? '') ? 'test' : 'production'
    return {
      provider: 'skydropx', clientId: cfg.skydropx_client_id, clientSecret: cfg.skydropx_client_secret,
      environment: legacyEnv, baseUrl: cleanApiBase(cfg.skydropx_base_url),
      addressFromId: cfg.skydropx_address_from_id ?? undefined,
    }
  }
  return null
}
