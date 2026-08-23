import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfig, updatePaymentConfig } from '@merkiai/database'
import type { PaymentConfig } from '@merkiai/database'

/** Enmascara los últimos 4 caracteres de un secret. Devuelve null si el campo es null. */
function maskSecret(value: string | null): string | null {
  if (!value) return null
  if (value.length <= 4) return '••••'
  return `••••${value.slice(-4)}`
}

type MaskedPaymentConfig = Omit<
  PaymentConfig,
  'wompi_private_key' | 'wompi_integrity_secret' | 'wompi_events_secret' | 'mercadopago_access_token' | 'mercadopago_webhook_secret' | 'tucompra_password' | 'tucompra_public_key' | 'tucompra_encryption_key' | 'bold_secret_key'
> & {
  wompi_private_key: string | null
  wompi_integrity_secret: string | null
  wompi_events_secret: string | null
  mercadopago_access_token: string | null
  mercadopago_webhook_secret: string | null
  tucompra_password: string | null
  tucompra_public_key: string | null
  tucompra_encryption_key: string | null
  bold_secret_key: string | null
  // Indica si cada secret ya tiene un valor guardado (para mostrar en la UI)
  has_wompi_private_key: boolean
  has_wompi_integrity_secret: boolean
  has_wompi_events_secret: boolean
  has_mercadopago_access_token: boolean
  has_mercadopago_webhook_secret: boolean
  has_tucompra_password: boolean
  has_tucompra_public_key: boolean
  has_tucompra_encryption_key: boolean
  has_bold_secret_key: boolean
}

function maskConfig(config: PaymentConfig): MaskedPaymentConfig {
  return {
    ...config,
    wompi_private_key: maskSecret(config.wompi_private_key),
    wompi_integrity_secret: maskSecret(config.wompi_integrity_secret),
    wompi_events_secret: maskSecret(config.wompi_events_secret),
    mercadopago_access_token: maskSecret(config.mercadopago_access_token),
    mercadopago_webhook_secret: maskSecret(config.mercadopago_webhook_secret),
    tucompra_password: maskSecret(config.tucompra_password),
    tucompra_public_key: maskSecret(config.tucompra_public_key),
    tucompra_encryption_key: maskSecret(config.tucompra_encryption_key),
    bold_secret_key: maskSecret(config.bold_secret_key),
    // Flags para que la UI sepa si ya hay un valor
    has_wompi_private_key: !!config.wompi_private_key,
    has_wompi_integrity_secret: !!config.wompi_integrity_secret,
    has_wompi_events_secret: !!config.wompi_events_secret,
    has_mercadopago_access_token: !!config.mercadopago_access_token,
    has_mercadopago_webhook_secret: !!config.mercadopago_webhook_secret,
    has_tucompra_password: !!config.tucompra_password,
    has_tucompra_public_key: !!config.tucompra_public_key,
    has_tucompra_encryption_key: !!config.tucompra_encryption_key,
    has_bold_secret_key: !!config.bold_secret_key,
  }
}

const VALID_PROVIDERS = ['none', 'wompi', 'mercadopago', 'tucompra', 'bold'] as const

export async function GET() {
  try {
    const config = await getPaymentConfig()
    if (!config) {
      return NextResponse.json({
        id: 1,
        active_provider: 'none',
        wompi_public_key: null,
        wompi_private_key: null,
        wompi_integrity_secret: null,
        wompi_events_secret: null,
        mercadopago_access_token: null,
        mercadopago_public_key: null,
        mercadopago_webhook_secret: null,
        tucompra_user: null,
        tucompra_password: null,
        tucompra_terminal: null,
        tucompra_api_url: null,
        tucompra_public_key: null,
        tucompra_encryption_key: null,
        tucompra_methods: [],
        tucompra_sandbox: true,
        bold_api_key: null,
        bold_secret_key: null,
        bold_sandbox: true,
        updated_at: new Date().toISOString(),
        has_wompi_private_key: false,
        has_wompi_integrity_secret: false,
        has_wompi_events_secret: false,
        has_mercadopago_access_token: false,
        has_mercadopago_webhook_secret: false,
        has_tucompra_password: false,
        has_tucompra_public_key: false,
        has_tucompra_encryption_key: false,
        has_bold_secret_key: false,
      })
    }
    return NextResponse.json(maskConfig(config))
  } catch (err) {
    console.error('[admin/payment-config GET]', err)
    return NextResponse.json({ error: 'Error cargando configuración de pagos' }, { status: 500 })
  }
}

/**
 * Comprueba que la pasarela que se quiere activar tenga credenciales completas,
 * combinando lo que llega en el body con lo ya guardado en `current`. Devuelve
 * la lista de campos faltantes (vacía si está OK).
 */
function missingCredentials(
  provider: string,
  body: Partial<PaymentConfig>,
  current: PaymentConfig | null,
): string[] {
  const eff = <K extends keyof PaymentConfig>(k: K) =>
    (body as Partial<PaymentConfig>)[k] ?? current?.[k] ?? null
  if (provider === 'wompi') {
    return [
      !eff('wompi_public_key') && 'wompi_public_key',
      !eff('wompi_integrity_secret') && 'wompi_integrity_secret',
    ].filter(Boolean) as string[]
  }
  if (provider === 'mercadopago') {
    return [!eff('mercadopago_access_token') && 'mercadopago_access_token'].filter(Boolean) as string[]
  }
  if (provider === 'tucompra') {
    return [
      !eff('tucompra_user') && 'tucompra_user',
      !eff('tucompra_password') && 'tucompra_password',
      !eff('tucompra_terminal') && 'tucompra_terminal',
    ].filter(Boolean) as string[]
  }
  if (provider === 'bold') {
    // La llave secreta puede ir vacía en sandbox; en producción se exige.
    const sandbox = (body as Partial<PaymentConfig>).bold_sandbox ?? current?.bold_sandbox ?? true
    return [
      !eff('bold_api_key') && 'bold_api_key',
      !sandbox && !eff('bold_secret_key') && 'bold_secret_key',
    ].filter(Boolean) as string[]
  }
  return []
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Omit<PaymentConfig, 'id' | 'updated_at'>>

    // Validación básica: public_key de Wompi debe empezar con pub_
    if (body.wompi_public_key && !body.wompi_public_key.startsWith('pub_')) {
      return NextResponse.json(
        { error: 'La llave pública de Wompi debe comenzar con "pub_"' },
        { status: 400 },
      )
    }

    // Validar la pasarela activa (única). Solo un valor permitido a la vez.
    if (body.active_provider !== undefined) {
      if (!VALID_PROVIDERS.includes(body.active_provider as typeof VALID_PROVIDERS[number])) {
        return NextResponse.json(
          { error: `Proveedor inválido. Valores permitidos: ${VALID_PROVIDERS.join(', ')}` },
          { status: 400 },
        )
      }
      // No permitir activar una pasarela sin credenciales completas (evita
      // dejar el checkout apuntando a una pasarela que no puede cobrar).
      if (body.active_provider !== 'none') {
        const current = await getPaymentConfig()
        const missing = missingCredentials(body.active_provider, body, current)
        if (missing.length) {
          return NextResponse.json(
            { error: `Para activar ${body.active_provider} faltan credenciales`, missing },
            { status: 400 },
          )
        }
      }
    }

    const updated = await updatePaymentConfig(body)
    return NextResponse.json(maskConfig(updated))
  } catch (err) {
    console.error('[admin/payment-config PATCH]', err)
    return NextResponse.json({ error: 'Error guardando configuración de pagos' }, { status: 500 })
  }
}
