/**
 * SupabaseStorageProvider — StorageProvider sobre Supabase Storage.
 *
 * Estrategia de aislamiento: bucket = `folder`, y el path del objeto lleva el
 * `tenantId` como primer segmento → `key = <folder>/<tenantId>/<filename>`.
 * Así un tenant no puede leer/borrar objetos de otro por más que comparta bucket.
 *
 * Recibe un cliente Supabase con permisos de Storage (service-role) inyectado
 * por la ruta: el service-role queda SOLO en el borde (la ruta), no disperso.
 * Endurecimiento futuro (HU-227): políticas RLS sobre `storage.objects` por
 * prefijo de path + JWT de tenant, para llevar la frontera al motor de storage.
 */
import type { StorageProvider, StorageUploadInput, StorageObject } from './types'

// Cliente mínimo que necesitamos (evita acoplar a un tipo concreto de SDK).
interface StorageBucketApi {
  upload(path: string, body: unknown, opts?: { contentType?: string; upsert?: boolean }): Promise<{ error: { message: string } | null }>
  remove(paths: string[]): Promise<{ error: { message: string } | null }>
  getPublicUrl(path: string): { data: { publicUrl: string } }
}
interface SupabaseStorageLike {
  storage: {
    from(bucket: string): StorageBucketApi
    listBuckets(): Promise<{ data: { name: string }[] | null }>
    createBucket(name: string, opts?: { public?: boolean }): Promise<{ error: { message: string } | null }>
  }
}

export class SupabaseStorageProvider implements StorageProvider {
  readonly name = 'supabase'

  constructor(
    private readonly client: SupabaseStorageLike,
    /** Tenant por defecto: permite borrar objetos legacy sin prefijo de tenant. */
    private readonly defaultTenantId = '00000000-0000-0000-0000-000000000001',
  ) {}

  /** Path del objeto dentro del bucket: `<tenantId>/<filename>`. */
  private objectPath(tenantId: string, filename: string): string {
    return `${tenantId}/${filename}`
  }

  private parseKey(key: string): { bucket: string; path: string } {
    const idx = key.indexOf('/')
    return { bucket: key.slice(0, idx), path: key.slice(idx + 1) }
  }

  ownsKey(tenantId: string, key: string): boolean {
    // Clave nueva: `<folder>/<tenantId>/<file>` → el 2º segmento es el tenant.
    const parts = key.split('/')
    if (parts.length >= 3) return parts[1] === tenantId
    // Clave legacy `<folder>/<file>` (sin tenant): solo el tenant por defecto.
    return tenantId === this.defaultTenantId
  }

  async upload({ tenantId, folder, filename, contentType, body }: StorageUploadInput): Promise<StorageObject> {
    const bucket = folder
    const path = this.objectPath(tenantId, filename)

    // Asegurar bucket público (idempotente).
    const { data: buckets } = await this.client.storage.listBuckets()
    if (!buckets?.some((b) => b.name === bucket)) {
      const { error } = await this.client.storage.createBucket(bucket, { public: true })
      if (error) throw new Error(`No se pudo crear el bucket: ${error.message}`)
    }

    const { error } = await this.client.storage.from(bucket).upload(path, body, { contentType, upsert: false })
    if (error) throw new Error(error.message)

    const { data } = this.client.storage.from(bucket).getPublicUrl(path)
    return { key: `${bucket}/${path}`, url: data.publicUrl }
  }

  async remove(tenantId: string, key: string): Promise<void> {
    if (!this.ownsKey(tenantId, key)) {
      throw new Error('[storage] La clave no pertenece al tenant (borrado cruzado bloqueado).')
    }
    const { bucket, path } = this.parseKey(key)
    const { error } = await this.client.storage.from(bucket).remove([path])
    if (error) throw new Error(error.message)
  }
}
