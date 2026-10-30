/**
 * HU-353 AC-5 · Portabilidad de colecciones en los paquetes.
 *
 * Serializa la **definición** de una colección (y, opcionalmente, registros de
 * ejemplo) a un paquete JSON tolerante — mismo patrón que `page-package.ts`.
 * Permite que un preset/sitio lleve sus tipos de contenido (p. ej. un preset de
 * educación ship "cursos"; uno de portal, "noticias"/"eventos"). Puro + helpers BD.
 */
import type { Db } from '../client'
import {
  type Collection, type CollectionItem,
  createCollection, createCollectionItem, getCollection, listCollectionItems, normalizeFields,
} from './collections'

export const COLLECTION_PACKAGE_KIND = 'merkiai.collection' as const

/** Campos de la definición que viajan (sin tenant/timestamps/id). */
export const PACKAGE_COLLECTION_FIELDS = [
  'key', 'label', 'label_plural', 'description', 'icon', 'fields', 'enabled', 'order_index',
] as const

export interface CollectionPackage {
  kind: typeof COLLECTION_PACKAGE_KIND
  definition: Record<string, unknown>
  /** Registros de ejemplo (opcional). */
  records?: Record<string, unknown>[]
}

/** Construye el paquete de una colección (pura). Records solo si se piden. */
export function buildCollectionPackage(
  collection: Pick<Collection, 'key' | 'label' | 'label_plural' | 'description' | 'icon' | 'fields' | 'enabled' | 'order_index'>,
  records?: CollectionItem[],
): CollectionPackage {
  const def: Record<string, unknown> = {}
  for (const k of PACKAGE_COLLECTION_FIELDS) def[k] = (collection as Record<string, unknown>)[k]
  const pkg: CollectionPackage = { kind: COLLECTION_PACKAGE_KIND, definition: def }
  if (records) {
    pkg.records = records.map((r) => ({ slug: r.slug, status: r.status, data: r.data, order_index: r.order_index }))
  }
  return pkg
}

export class CollectionPackageError extends Error {}

export interface ParsedCollectionPackage {
  definition: Record<string, unknown>
  records: Record<string, unknown>[]
}

/** Valida/normaliza un paquete de colección (tolerante). */
export function parseCollectionPackage(raw: unknown): ParsedCollectionPackage {
  if (!raw || typeof raw !== 'object') throw new CollectionPackageError('Paquete de colección inválido.')
  const pkg = raw as Record<string, unknown>
  if (pkg.kind !== COLLECTION_PACKAGE_KIND) throw new CollectionPackageError('No es un paquete de colección Merkiai.')
  const defRaw = (pkg.definition && typeof pkg.definition === 'object') ? pkg.definition as Record<string, unknown> : {}
  const def: Record<string, unknown> = {}
  for (const k of PACKAGE_COLLECTION_FIELDS) if (k in defRaw) def[k] = defRaw[k]
  if (!def.key || !def.label) throw new CollectionPackageError('El paquete necesita key y label.')
  def.fields = normalizeFields(def.fields)
  const records = Array.isArray(pkg.records)
    ? pkg.records.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    : []
  return { definition: def, records }
}

// ─── Helpers de BD ───────────────────────────────────────────────────────────

/** Exporta una colección a paquete (con/ sin registros de ejemplo). */
export async function exportCollection(key: string, db: Db, includeRecords = false): Promise<CollectionPackage> {
  const collection = await getCollection(key, db)
  if (!collection) throw new CollectionPackageError('Colección no encontrada.')
  const records = includeRecords ? await listCollectionItems(db, { collectionKey: key }).catch(() => []) : undefined
  return buildCollectionPackage(collection, records)
}

export interface ImportCollectionOptions {
  tenantId?: string
  /** Si true, crea también los registros de ejemplo del paquete. */
  includeRecords?: boolean
}

/**
 * Importa un paquete de colección: crea la DEFINICIÓN (si la key ya existe, no la
 * duplica → reutiliza la existente) y, opcionalmente, sus registros de ejemplo.
 * Idempotente a nivel de definición por `key`.
 */
export async function importCollectionPackage(raw: unknown, db: Db, opts: ImportCollectionOptions = {}): Promise<Collection> {
  const { definition, records } = parseCollectionPackage(raw)
  const key = String(definition.key)

  let collection = await getCollection(key, db).catch(() => null)
  if (!collection) {
    collection = await createCollection({
      key,
      label: String(definition.label),
      label_plural: (definition.label_plural as string) ?? null,
      description: (definition.description as string) ?? null,
      icon: (definition.icon as string) ?? null,
      fields: normalizeFields(definition.fields),
      enabled: definition.enabled !== false,
      order_index: typeof definition.order_index === 'number' ? definition.order_index : 0,
      tenant_id: opts.tenantId,
    }, db)
  }

  if (opts.includeRecords && records.length) {
    for (const [i, r] of records.entries()) {
      await createCollectionItem({
        collection_key: key,
        slug: (r.slug as string) || undefined,
        status: r.status === 'published' ? 'published' : 'draft',
        data: (r.data && typeof r.data === 'object') ? r.data as Record<string, unknown> : {},
        order_index: typeof r.order_index === 'number' ? r.order_index : i,
        tenant_id: opts.tenantId,
      }, db).catch(() => { /* registro de ejemplo inválido: se omite, no rompe el import */ })
    }
  }
  return collection
}
