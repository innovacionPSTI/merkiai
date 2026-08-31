/**
 * Storage Provider Factory (HU-230).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  provider (plan/config)   │  Returned provider                │
 * ├──────────────────────────────────────────────────────────────┤
 * │  'supabase' (default)     │  SupabaseStorageProvider(client)  │
 * │  's3' / 'r2' (futuro)     │  <Name>Provider(creds)            │
 * └──────────────────────────────────────────────────────────────┘
 *
 * El tipo de storage puede depender del PLAN del tenant (bucket compartido vs
 * credenciales propias). Hoy solo 'supabase'; el seam queda listo.
 */
import { SupabaseStorageProvider } from './SupabaseStorageProvider'
import type { StorageProvider } from './types'

export type { StorageProvider, StorageUploadInput, StorageObject } from './types'
export { SupabaseStorageProvider } from './SupabaseStorageProvider'

export interface StorageProviderConfig {
  /** Slug del proveedor (futuro: del plan/store_config). Default 'supabase'. */
  provider?: string | null
  /** Cliente Supabase con acceso a Storage (service-role), inyectado por la ruta. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
  /** Tenant por defecto (para permitir borrar objetos legacy sin prefijo). */
  defaultTenantId?: string
}

/**
 * Factory — llamar por request. No cachear entre requests: el plan/tenant puede
 * cambiar el proveedor efectivo.
 */
export function getStorageProvider(config: StorageProviderConfig): StorageProvider {
  const provider = config.provider ?? 'supabase'
  switch (provider) {
    case 'supabase':
    default:
      return new SupabaseStorageProvider(config.client, config.defaultTenantId)
  }
}
