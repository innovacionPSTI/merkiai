/**
 * queries/seed.ts — Semilla de configuración por tenant (HU-207).
 *
 * Al aprovisionar un tenant nuevo (HU-209), su config vive en el PLANO DE TIENDA
 * (store_config/payment_config/shipping_config/admin_config) y necesita una fila
 * por tenant + la página `home` para que el storefront y el admin operen desde
 * el minuto cero. Esta función es **idempotente** (upsert por tenant): re-correr
 * no duplica ni pisa datos ya editados por el comerciante (usa las columnas
 * mínimas; el resto lo llenan los defaults del esquema).
 *
 * Se ejecuta con service-role desde el endpoint interno del admin (autorizado
 * por el control plane), porque toca varias tablas del plano de tienda antes de
 * que exista sesión del dueño.
 */
import { createServerClient, type Db } from '../client'

export interface SeedTenantConfigInput {
  /** Nombre visible de la tienda (por defecto, genérico). */
  storeName?: string
}

export interface SeedTenantConfigResult {
  tenantId: string
  results: Record<string, 'ok' | string>
}

export async function seedTenantConfig(
  tenantId: string,
  input: SeedTenantConfigInput = {},
  db: Db = createServerClient(),
): Promise<SeedTenantConfigResult> {
  if (!tenantId) throw new Error('[seed] tenantId requerido')
  const supabase = db
  const storeName = (input.storeName ?? '').trim() || 'Mi Tienda'
  const results: Record<string, 'ok' | string> = {}

  // Upsert idempotente por tenant. onConflict = clave por tenant (e17/03/07).
  // ignoreDuplicates: no pisa filas existentes (config ya editada por el dueño).
  const step = async (
    table: string,
    row: Record<string, unknown>,
    onConflict: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(table)
      .upsert(row, { onConflict, ignoreDuplicates: true })
    results[table] = error ? `error: ${error.message}` : 'ok'
  }

  await step('store_config',    { tenant_id: tenantId, store_name: storeName, template: 'default' }, 'tenant_id')
  await step('payment_config',  { tenant_id: tenantId }, 'tenant_id') // active_provider default 'none'
  await step('shipping_config', { tenant_id: tenantId }, 'tenant_id')
  await step('admin_config',    { tenant_id: tenantId }, 'tenant_id')
  // Página home del tenant (PK compuesta tenant_id,key tras e17/04).
  await step('pages', {
    tenant_id: tenantId, key: 'home', label: 'Inicio', slug: '',
    page_type: 'home', enabled: true, show_in_footer: false, order_index: 0,
  }, 'tenant_id,key')

  return { tenantId, results }
}
