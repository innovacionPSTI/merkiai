import { createServerClient, type Db } from '../client'
import type { PaymentConfig } from '../types'

/** Tenant por defecto (config por-tenant, HU-207). */
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

/** Lee la configuración de pasarelas de pago del tenant. */
export async function getPaymentConfig(db: Db = createServerClient(), tenantId: string = DEFAULT_TENANT_ID): Promise<PaymentConfig | null> {
  const supabase = db
  const { data, error } = await supabase
    .from('payment_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) throw error
  return (data as PaymentConfig | null) ?? null
}

/** Actualiza la configuración de pasarelas de pago.
 *  Los campos de secret que vengan como string vacío se omiten para
 *  evitar sobreescribir credenciales existentes accidentalmente. */
export async function updatePaymentConfig(
  input: Partial<Omit<PaymentConfig, 'id' | 'updated_at'>>, db: Db = createServerClient(), tenantId: string = DEFAULT_TENANT_ID
): Promise<PaymentConfig> {
  const supabase = db

  // Filtrar strings vacíos en campos de credenciales secretas
  const secretFields = [
    'wompi_public_key',
    'wompi_private_key',
    'wompi_integrity_secret',
    'wompi_events_secret',
    'mercadopago_access_token',
    'mercadopago_public_key',
    'tucompra_merchant_id',
    'tucompra_secret_key',
    'bold_api_key',
    'bold_secret_key',
  ] as const

  const sanitized: typeof input = { ...input }
  for (const field of secretFields) {
    if (field in sanitized && sanitized[field] === '') {
      delete sanitized[field]
    }
  }

  const { data, error } = await supabase
    .from('payment_config')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ tenant_id: tenantId, ...sanitized, updated_at: new Date().toISOString() } as any, { onConflict: 'tenant_id' })
    .select()
    .single()

  if (error) throw error
  return data as PaymentConfig
}
