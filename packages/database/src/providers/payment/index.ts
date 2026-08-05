/**
 * Payment Gateway Factory
 *
 * Solo UNA pasarela puede estar activa a la vez: `payment_config.active_provider`
 * ('none' | 'wompi' | 'mercadopago' | 'tucompra'), igual que shipping_config.provider.
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  method        │  Gateway               │  Activa cuando…         │
 * ├───────────────────────────────────────────────────────────────────┤
 * │  'wompi'       │  WompiGateway          │  active_provider='wompi'│
 * │  'mercadopago' │  MercadoPagoGateway    │  = 'mercadopago'        │
 * │  'tucompra'    │  TuCompraGateway       │  = 'tucompra'           │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Adding a new gateway:
 *   1. Create src/providers/payment/<Name>Gateway.ts implementing PaymentGateway.
 *   2. Add credentials to payment_config (migration + types.ts) + al CHECK de active_provider.
 *   3. Add a case below.
 *   4. Add la opción al selector "Proveedor activo" en admin PaymentConfigForm.
 */

import type { PaymentConfig } from '../../types'
import { WompiGateway } from './WompiGateway'
import { MercadoPagoGateway } from './MercadoPagoGateway'
import { TuCompraGateway } from './TuCompraGateway'
import { BoldGateway } from './BoldGateway'
import type { PaymentGateway } from './types'

export type { PaymentGateway, CreatePaymentParams, PaymentStatus, WebhookPaymentData } from './types'
export { WompiGateway } from './WompiGateway'
export type { WompiConfig } from './WompiGateway'
export { MercadoPagoGateway } from './MercadoPagoGateway'
export type { MercadoPagoConfig } from './MercadoPagoGateway'
export { TuCompraGateway } from './TuCompraGateway'
export type { TuCompraConfig } from './TuCompraGateway'
export { BoldGateway } from './BoldGateway'
export type { BoldConfig } from './BoldGateway'

/**
 * Returns the PaymentGateway implementation for the given method.
 * Validates that the gateway is active and credentials are present.
 * Throws with a user-friendly error message on failure.
 */
export function getPaymentGateway(
  method: string,
  config: PaymentConfig,
): PaymentGateway {
  switch (method) {
    case 'wompi': {
      if (config.active_provider !== 'wompi') {
        throw new Error('Wompi no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.wompi_public_key || !config.wompi_integrity_secret) {
        throw new Error('Wompi: faltan credenciales (public_key o integrity_secret).')
      }
      return new WompiGateway({
        publicKey: config.wompi_public_key,
        integritySecret: config.wompi_integrity_secret,
        eventsSecret: config.wompi_events_secret ?? undefined,
      })
    }

    case 'mercadopago': {
      if (config.active_provider !== 'mercadopago') {
        throw new Error('MercadoPago no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.mercadopago_access_token) {
        throw new Error('MercadoPago: falta el access token.')
      }
      return new MercadoPagoGateway({
        accessToken: config.mercadopago_access_token,
        publicKey: config.mercadopago_public_key ?? undefined,
      })
    }

    case 'tucompra': {
      if (config.active_provider !== 'tucompra') {
        throw new Error('Tu Compra no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.tucompra_merchant_id || !config.tucompra_secret_key) {
        throw new Error('Tu Compra: faltan credenciales (merchant_id o secret_key).')
      }
      return new TuCompraGateway({
        merchantId: config.tucompra_merchant_id,
        secretKey:  config.tucompra_secret_key,
        sandbox:    config.tucompra_sandbox ?? true,
      })
    }

    case 'bold': {
      if (config.active_provider !== 'bold') {
        throw new Error('Bold no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.bold_api_key || !config.bold_secret_key) {
        throw new Error('Bold: faltan credenciales (api_key o secret_key).')
      }
      return new BoldGateway({
        apiKey:    config.bold_api_key,
        secretKey: config.bold_secret_key,
        sandbox:   config.bold_sandbox ?? true,
      })
    }

    default:
      throw new Error(`Pasarela de pago desconocida: "${method}"`)
  }
}

export type ActivePaymentProvider = 'none' | 'wompi' | 'mercadopago' | 'tucompra' | 'bold'

/**
 * Devuelve la pasarela activa (única) SOLO si además tiene sus credenciales
 * completas. Fail-closed: si active_provider apunta a una pasarela sin
 * credenciales, devuelve 'none' (no se puede cobrar → validación manual).
 *
 * Esta es la fuente de verdad del servidor: el checkout NUNCA debe confiar en
 * el método enviado por el cliente, sino derivarlo de aquí.
 */
export function getActiveProvider(config: PaymentConfig): ActivePaymentProvider {
  switch (config.active_provider) {
    case 'wompi':
      return config.wompi_public_key && config.wompi_integrity_secret ? 'wompi' : 'none'
    case 'mercadopago':
      return config.mercadopago_access_token ? 'mercadopago' : 'none'
    case 'tucompra':
      return config.tucompra_merchant_id && config.tucompra_secret_key ? 'tucompra' : 'none'
    case 'bold':
      return config.bold_api_key && config.bold_secret_key ? 'bold' : 'none'
    default:
      return 'none'
  }
}

/**
 * Lista de pasarelas disponibles para el checkout. Con el modelo de pasarela
 * única, devuelve `[activa]` o `[]` (cuando es 'none' → pago manual).
 */
export function getActiveGateways(config: PaymentConfig): string[] {
  const active = getActiveProvider(config)
  return active === 'none' ? [] : [active]
}
