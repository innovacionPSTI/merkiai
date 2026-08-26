/**
 * Connection factory: enruta a la base de datos correcta por tenant según su
 * `db_ref` (costura de HU-156, materializada por HU-200). Default = BD
 * compartida (pooled + RLS). Habilita schema/BD dedicada por plan sin
 * reescribir la app.
 */
import type { TenantClientOptions } from './client'
import type { TenantRecord } from './types'

/** Configuración de conexión de un destino de datos (url + anon key). */
export interface DbTarget {
  url: string
  anonKey: string
}

/**
 * Registro de destinos de datos, indexado por `db_ref`. La clave `'shared'`
 * (o `null` en el tenant) resuelve al destino compartido por defecto.
 */
export interface DbTargetRegistry {
  /** Destino compartido (pooled + RLS) usado cuando `db_ref` es null/'shared'. */
  shared: DbTarget
  /** Destinos dedicados por `db_ref` (schema o BD/proyecto propio). */
  dedicated?: Record<string, DbTarget>
}

/**
 * Resuelve el destino de datos de un tenant. Fail-closed: si el `db_ref` apunta
 * a un destino dedicado inexistente, lanza (no cae silenciosamente al compartido).
 */
export function resolveDbTarget(tenant: TenantRecord, registry: DbTargetRegistry): DbTarget {
  const ref = tenant.dbRef
  if (!ref || ref === 'shared') return registry.shared

  const target = registry.dedicated?.[ref]
  if (!target) {
    throw new Error(`[tenancy] db_ref sin destino registrado: ${ref} (tenant ${tenant.tenantId})`)
  }
  return target
}

/**
 * Arma las opciones para `createTenantClient` de un tenant: resuelve su destino
 * por `db_ref` y adjunta el proveedor de access token (JWT con tenant_id).
 */
export function buildTenantClientOptions(
  tenant: TenantRecord,
  registry: DbTargetRegistry,
  accessToken: () => Promise<string>,
): TenantClientOptions {
  const target = resolveDbTarget(tenant, registry)
  return { url: target.url, anonKey: target.anonKey, accessToken }
}
