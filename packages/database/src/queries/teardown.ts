/**
 * queries/teardown.ts — Des-aprovisionamiento de un tenant (HU-209 · borrado).
 *
 * Elimina TODOS los datos del plano de tienda de un tenant (config, contenido,
 * catálogo, pedidos, clientes, perfiles). Pensado para dar de baja una tienda
 * (p. ej. tenants de prueba). Se ejecuta con service-role desde el endpoint
 * interno del admin (autorizado por el control plane).
 *
 * Orden **hijos → padres** para no violar FKs aunque no todas tengan cascade.
 * La fila de plataforma (`tenants`) y el Team de Stack Auth los borra la consola.
 */
import { createServerClient, type Db } from '../client'

/** Tablas del plano de tienda con `tenant_id`, en orden seguro de borrado. */
const PURGE_ORDER = [
  'section_items',
  'order_items',
  'cart_items',
  'customer_addresses',
  'page_sections',
  'nav_items',
  'product_variants',
  'products',
  'orders',
  'customers',
  'categories',
  'variant_types',
  'coupons',
  'blog_posts',
  'media_assets',
  'themes',
  'newsletter_subscribers',
  'shipping_profiles',
  'pages',
  'store_config',
  'payment_config',
  'shipping_config',
  'admin_config',
  'profiles',
] as const

export interface PurgeTenantResult {
  tenantId: string
  results: Record<string, 'ok' | string>
}

/**
 * Borra todas las filas con ese `tenant_id` en el plano de tienda. Best-effort
 * por tabla: si una falla, continúa y reporta el error (no aborta el resto).
 */
export async function purgeTenantData(
  tenantId: string,
  db: Db = createServerClient(),
): Promise<PurgeTenantResult> {
  if (!tenantId) throw new Error('[teardown] tenantId requerido')
  // Sin trato especial al tenant por defecto (HU-232): es una tienda más.

  const supabase = db
  const results: Record<string, 'ok' | string> = {}

  for (const table of PURGE_ORDER) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(table).delete().eq('tenant_id', tenantId)
    results[table] = error ? `error: ${error.message}` : 'ok'
  }
  return { tenantId, results }
}
