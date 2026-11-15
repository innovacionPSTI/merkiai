/**
 * SupabaseStorageProvider — StorageProvider sobre Supabase Storage.
 *
 * Estrategia de aislamiento: bucket = `folder`, y el path del objeto lleva el
 * `tenantId` como primer segmento → `key = <folder>/<tenantId>/<filename>`.
 * Así un tenant no puede leer/borrar objetos de otro por más que comparta bucket.
 *
 * Recibe un cliente Supabase con permisos de Storage (service-role) inyectado
 * por la ruta: el service-role queda SOLO en el borde (la ruta), no disperso.
 * Hardening (e17/77): con `STORAGE_RLS_ENFORCED=true` la ruta inyecta el cliente
 * con JWT de tenant (sin service-role) y las políticas RLS de `storage.objects`
 * solo permiten escribir bajo el prefijo del tenant. En ese modo los buckets ya
 * existen (los crea la migración) y no se intenta crearlos (`ensureBuckets=false`).
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
    /** Crear el bucket si no existe (requiere service-role). `false` con RLS por tenant. */
    private readonly ensureBuckets = true,
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

    // Asegurar bucket público (idempotente). Con RLS por tenant no aplica: la
    // migración e17/77 crea los buckets y el JWT de tenant no puede listarlos.
    const { data: buckets } = this.ensureBuckets ? await this.client.storage.listBuckets() : { data: [{ name: bucket }] }
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
