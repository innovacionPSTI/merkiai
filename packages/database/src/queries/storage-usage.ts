/**
 * queries/storage-usage.ts — Registro y medición del storage por tenant (HU-432).
 *
 * Cada subida queda en `storage_objects` (clave + tamaño); el uso es la suma por
 * tenant (vista `storage_usage`). `checkStorageQuota` es PURO y decide si una
 * subida cabe en el tope del plan (`max_media_mb`; null = ilimitado).
 */
import type { Db } from '../client'

const MB = 1024 * 1024

export interface StorageUsage { bytes: number; objects: number }

export interface QuotaCheck {
  ok: boolean
  usedBytes: number
  limitBytes: number | null
  /** Mensaje para el comerciante si no cabe. */
  message?: string
}

const fmtMb = (bytes: number) => `${(bytes / MB).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`

/** ¿Cabe un archivo de `incomingBytes` dado el uso y el límite en MB? PURO. */
export function checkStorageQuota(usedBytes: number, incomingBytes: number, limitMb: number | null | undefined): QuotaCheck {
  if (limitMb == null) return { ok: true, usedBytes, limitBytes: null }
  const limitBytes = Math.max(0, limitMb) * MB
  if (usedBytes + incomingBytes <= limitBytes) return { ok: true, usedBytes, limitBytes }
  return {
    ok: false, usedBytes, limitBytes,
    message: `Tu plan incluye ${fmtMb(limitBytes)} de archivos y ya usas ${fmtMb(usedBytes)}. Libera espacio en Medios o mejora tu plan.`,
  }
}

// La tabla/vista son nuevas (e17/75) y aún no están en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (db: Db) => db as any

export async function getStorageUsage(db: Db, tenantId: string): Promise<StorageUsage> {
  const { data, error } = await t(db).from('storage_usage').select('bytes, objects').eq('tenant_id', tenantId).maybeSingle()
  if (error) throw new Error(`[storage-usage] ${error.message}`)
  return { bytes: Number(data?.bytes ?? 0), objects: Number(data?.objects ?? 0) }
}

export async function recordStorageObject(
  db: Db,
  o: { tenantId: string; provider: string; key: string; folder: string; sizeBytes: number; contentType: string | null },
): Promise<void> {
  const { error } = await t(db).from('storage_objects').upsert({
    tenant_id: o.tenantId, provider: o.provider, key: o.key, folder: o.folder, size_bytes: o.sizeBytes, content_type: o.contentType,
  }, { onConflict: 'tenant_id,key' })
  if (error) throw new Error(`[storage-usage] registrar: ${error.message}`)
}

export async function removeStorageObject(db: Db, tenantId: string, key: string): Promise<void> {
  const { error } = await t(db).from('storage_objects').delete().eq('tenant_id', tenantId).eq('key', key)
  if (error) throw new Error(`[storage-usage] borrar: ${error.message}`)
}
