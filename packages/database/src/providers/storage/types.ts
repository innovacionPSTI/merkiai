/**
 * StorageProvider abstraction (HU-230).
 *
 * Cualquier backend de archivos (Supabase Storage, S3, Cloudflare R2, GCS…)
 * implementa esta interfaz. Los llamadores (upload del admin, futuros
 * generadores de imágenes IA) solo dependen de estos tipos, no del proveedor.
 *
 * Separación por tenant (frontera dura a nivel de ruta de objeto): TODA clave
 * se construye con el `tenantId` como primer segmento del path dentro del
 * bucket → un tenant nunca lee/escribe/borra objetos de otro. `ownsKey()` es el
 * guard que las rutas usan antes de borrar.
 *
 * El proveedor efectivo puede depender del PLAN del tenant (p. ej. bucket
 * compartido en plan básico vs bucket/credenciales propias en plan superior);
 * por eso el factory recibe la selección y el provider encapsula la estrategia.
 *
 * Agregar un proveedor:
 *   1. Crear src/providers/storage/<Name>Provider.ts implementando StorageProvider.
 *   2. Añadir un case en getStorageProvider() (index.ts).
 *   3. (Opcional) credenciales por tenant en store_config/plan + UI admin.
 */

export interface StorageUploadInput {
  /** Tenant dueño del objeto — primer segmento del path (aislamiento). */
  tenantId: string
  /** Carpeta lógica (products, media, ai…). Mapea a bucket o subruta. */
  folder: string
  /** Nombre de archivo ya saneado (sin path). */
  filename: string
  contentType: string
  /** Contenido del archivo. */
  body: ArrayBuffer | Uint8Array | Blob
}

export interface StorageObject {
  /** Clave estable del objeto (incluye tenantId): `<folder>/<tenantId>/<file>`. */
  key: string
  /** URL pública (o firmada, según proveedor). */
  url: string
}

export interface StorageProvider {
  /** Slug para logging/plan (e.g. 'supabase', 's3', 'r2'). */
  readonly name: string

  /** Sube un objeto acotado al tenant. Lanza en error. */
  upload(input: StorageUploadInput): Promise<StorageObject>

  /** Borra por clave. Debe validar `ownsKey(tenantId, key)` antes. */
  remove(tenantId: string, key: string): Promise<void>

  /** ¿La clave pertenece a este tenant? Guard anti-borrado cruzado. */
  ownsKey(tenantId: string, key: string): boolean
}
