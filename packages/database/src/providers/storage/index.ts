/**
 * Storage Provider Factory (HU-230 · HU-432).
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  provider                 │  Returned provider                        │
 * ├───────────────────────────────────────────────────────────────────────┤
 * │  'supabase' (default)     │  SupabaseStorageProvider(client)          │
 * │  'r2' / 's3'              │  S3StorageProvider(config S3-compatible)  │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * El proveedor se elige por entorno (`STORAGE_PROVIDER`), por celda en E26
 * (HU-430). Las claves tienen el mismo formato en todos (`<folder>/<tenant>/<file>`),
 * así el aislamiento por tenant y el registro de uso no dependen del proveedor.
 */
import { SupabaseStorageProvider } from './SupabaseStorageProvider'
import { S3StorageProvider, type S3StorageConfig } from './S3StorageProvider'
import type { StorageProvider } from './types'

export type { StorageProvider, StorageUploadInput, StorageObject } from './types'
export { SupabaseStorageProvider } from './SupabaseStorageProvider'
export { S3StorageProvider, signS3Request, sigV4SigningKey } from './S3StorageProvider'
export type { S3StorageConfig } from './S3StorageProvider'

/** Carpetas lógicas permitidas (evita crear buckets/prefijos arbitrarios desde el cliente). */
export const STORAGE_FOLDERS = ['products', 'media', 'content', 'logos', 'banners', 'blog'] as const
export type StorageFolder = (typeof STORAGE_FOLDERS)[number]
export function isStorageFolder(v: unknown): v is StorageFolder {
  return typeof v === 'string' && (STORAGE_FOLDERS as readonly string[]).includes(v)
}

export interface StorageProviderConfig {
  /** 'supabase' (default) | 'r2' | 's3'. */
  provider?: string | null
  /** Cliente Supabase con acceso a Storage (service-role), solo para 'supabase'. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any
  /** Config S3-compatible (para 'r2' / 's3'). */
  s3?: S3StorageConfig | null
  /** Tenant por defecto (para permitir borrar objetos legacy sin prefijo). */
  defaultTenantId?: string
}

/** Lee la configuración S3/R2 del entorno. `null` si falta algún dato. */
export function s3ConfigFromEnv(env: Record<string, string | undefined> = process.env): S3StorageConfig | null {
  const provider = env.STORAGE_PROVIDER
  const c = {
    endpoint: env.STORAGE_S3_ENDPOINT,
    bucket: env.STORAGE_S3_BUCKET,
    region: env.STORAGE_S3_REGION || (provider === 'r2' ? 'auto' : undefined),
    accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
    publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL,
  }
  if (!c.endpoint || !c.bucket || !c.region || !c.accessKeyId || !c.secretAccessKey || !c.publicBaseUrl) return null
  return {
    endpoint: c.endpoint, bucket: c.bucket, region: c.region, accessKeyId: c.accessKeyId,
    secretAccessKey: c.secretAccessKey, publicBaseUrl: c.publicBaseUrl, name: provider === 'r2' ? 'r2' : 's3',
  }
}

/**
 * Factory — llamar por request. Fail-closed: si se pide R2/S3 sin config
 * completa, lanza (no cae en silencio a otro proveedor).
 */
export function getStorageProvider(config: StorageProviderConfig): StorageProvider {
  const provider = config.provider ?? 'supabase'
  switch (provider) {
    case 'r2':
    case 's3':
      if (!config.s3) throw new Error(`[storage] ${provider} sin configuración (STORAGE_S3_* / STORAGE_PUBLIC_BASE_URL).`)
      return new S3StorageProvider(config.s3)
    case 'supabase':
    default:
      return new SupabaseStorageProvider(config.client, config.defaultTenantId)
  }
}
