/**
 * Shipping Provider Factory
 *
 * Reads the active shipping configuration from the database and returns
 * the appropriate ShippingProvider instance.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  shipping_config.provider  │  Returned provider              │
 * ├──────────────────────────────────────────────────────────────┤
 * │  'fixed'                   │  FixedRateProvider(fixed_rate)  │
 * │  'skydropx' + credentials  │  SkydropxProvider(credentials)  │
 * │  'skydropx' + missing creds│  FixedRateProvider (fallback)   │
 * │  DB error / no row         │  FixedRateProvider(8000)        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Adding a new provider:
 *   1. Add the slug to `shipping_provider_type` enum in the DB migration.
 *   2. Add columns for its credentials to `shipping_config`.
 *   3. Create `src/lib/shipping/providers/<name>/index.ts` implementing ShippingProvider.
 *   4. Add a case to the switch below.
 *   5. Update the admin configuración UI.
 */

import { getShippingConfig, resolveShippingCreds } from '@merkiai/database'
import { getStoreContext } from '../store-context'
import { getMachineDb } from '../machine-db'
import { FixedRateProvider } from './providers/fixed-rate'
import { SkydropxProvider } from './providers/skydropx'
import { skydropxApiBase } from './providers/skydropx/auth'
import type { ShippingProvider } from './types'

export type { ShippingProvider, ShippingRate, ShippingAddress, ShippingParcel, ParcelItem } from './types'
export { calculateParcel } from './types'

/**
 * Aplica el cargo adicional (fijo + %) a las tarifas de una transportadora.
 * Transparente para el comprador (se suma al total mostrado). No aplica a la
 * tarifa fija. HU-280.
 */
export function applyHandlingFee(
  rates: import('./types').ShippingRate[],
  fixed: number,
  percent: number,
): import('./types').ShippingRate[] {
  const f = Math.max(0, fixed || 0)
  const p = Math.max(0, percent || 0)
  if (!f && !p) return rates
  return rates.map((r) => ({ ...r, total_price: Math.round(r.total_price * (1 + p / 100) + f) }))
}
export { SkydropxProvider } from './providers/skydropx'
export type { SkydropxConfig, SkydropxOriginAddress, SkydropxShipmentResult } from './providers/skydropx'

/**
 * Factory — call once per request. Do NOT cache the returned provider
 * across requests since the admin can change the config at any time.
 */
export async function getShippingProvider(): Promise<ShippingProvider> {
  let config, creds
  try {
    const ctx = await getStoreContext()
    config = await getShippingConfig(ctx.db, ctx.tenantId)
    // ADR-004: las credenciales del carrier viven en integration_instances (RLS
    // admin_all). El storefront usa un cliente ANON que NO puede leerlas, así que
    // se resuelven con el cliente de MÁQUINA (server-side; los secretos nunca
    // salen al navegador). Fallback legacy a shipping_config.
    creds = await resolveShippingCreds(getMachineDb(ctx.tenantId), ctx.tenantId)
  } catch {
    console.warn('[shipping] Could not load shipping config — using fixed rate fallback')
    return new FixedRateProvider(8000)
  }

  // El método activo lo decide shipping_config.provider (fuente de verdad):
  //   'fixed'    → tarifa fija (autoritativo, aunque exista una transportadora).
  //   'skydropx' → transportadora activa; si no hay credenciales, cae a tarifa fija.
  if (config.provider === 'fixed') {
    return new FixedRateProvider(config.fixed_rate)
  }

  const wantsCarrier = creds !== null
  if (wantsCarrier && creds?.clientId && creds?.clientSecret) {
    const {
      origin_name, origin_street, origin_neighborhood, origin_city,
      origin_department, origin_postal_code, origin_phone, origin_email,
    } = config
    // postal_code is optional — Skydropx accepts area_level1+area_level2 without it
    const hasOrigin = origin_name && origin_street && origin_city &&
                      origin_department && origin_phone && origin_email
    if (!hasOrigin) {
      console.warn('[shipping] Skydropx: dirección de origen incompleta — usando tarifa fija')
      return new FixedRateProvider(config.fixed_rate)
    }
    return new SkydropxProvider({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      // El host del API se deriva del entorno (producción/sandbox); un base_url de
      // dashboard guardado por error se ignora en resolveShippingCreds.
      baseUrl: skydropxApiBase(creds.environment, creds.baseUrl),
      origin: {
        name: origin_name!,
        street: origin_street!,
        neighborhood: origin_neighborhood ?? '',
        city: origin_city!,
        department: origin_department!,
        postalCode: origin_postal_code!,
        phone: origin_phone!,
        email: origin_email!,
      },
    })
  }

  // 'fixed' / 'none' / sin credenciales → tarifa fija.
  return new FixedRateProvider(config.fixed_rate)
}
