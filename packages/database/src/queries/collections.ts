/**
 * HU-353 · Colecciones (tipos de contenido dinámicos) — capa de datos.
 *
 * Motor GENÉRICO (sin dato de nicho): una `collection` define un tipo de
 * contenido con campos tipados; `collection_items` son los registros. La
 * definición y la validación por esquema son PURAS (testeables sin BD); los
 * helpers de BD las envuelven. Multi-tenant por RLS (ver migración e17/56).
 *
 * Reutiliza la filosofía del contrato de campos del Constructor (blocks/schema):
 * tipos declarativos + storage en jsonb + validación tolerante.
 */
import type { Db } from '../client'
import type { Json } from '../types'

// ─── Contrato de campos ────────────────────────────────────────────────────────

/** Tipos de campo soportados por una colección (superset del contrato de bloques). */
export type CollectionFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'image'
  | 'file'
  | 'url'
  | 'select'
  | 'relation'

export const COLLECTION_FIELD_TYPES: CollectionFieldType[] = [
  'text', 'textarea', 'richtext', 'number', 'boolean', 'date',
  'image', 'file', 'url', 'select', 'relation',
]

export interface CollectionField {
  key: string
  label: string
  type: CollectionFieldType
  required?: boolean
  help?: string
  /** Opciones para `type: 'select'`. */
  options?: { value: string; label: string }[]
  /** Colección referenciada para `type: 'relation'` (su `key`). */
  relationTo?: string
}

export interface Collection {
  id: number
  tenant_id: string
  key: string
  label: string
  label_plural: string | null
  description: string | null
  icon: string | null
  fields: CollectionField[]
  enabled: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface CollectionItem {
  id: number
  tenant_id: string
  collection_key: string
  slug: string
  title: string | null
  status: 'draft' | 'published' | string
  data: Record<string, unknown>
  order_index: number
  published_at: string | null
  created_at: string
  updated_at: string
}

// ─── Helpers puros ──────────────────────────────────────────────────────────────

/** Slug URL-safe (minúsculas, sin acentos, guiones). */
export function slugifyCollection(s: string): string {
  return String(s ?? '')
    .trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Parsea/normaliza el array de campos (tolerante: descarta entradas inválidas). */
export function normalizeFields(raw: unknown): CollectionField[] {
  const arr = Array.isArray(raw) ? raw : []
  const out: CollectionField[] = []
  const seen = new Set<string>()
  for (const r of arr) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const key = slugifyCollection(String(o.key ?? o.label ?? '')).replace(/-/g, '_')
    const type = o.type as CollectionFieldType
    if (!key || seen.has(key) || !COLLECTION_FIELD_TYPES.includes(type)) continue
    seen.add(key)
    const field: CollectionField = {
      key,
      label: String(o.label ?? key),
      type,
      required: o.required === true,
    }
    if (typeof o.help === 'string') field.help = o.help
    if (type === 'select' && Array.isArray(o.options)) {
      field.options = o.options
        .map((op) => (op && typeof op === 'object' ? op as Record<string, unknown> : {}))
        .filter((op) => op.value != null)
        .map((op) => ({ value: String(op.value), label: String(op.label ?? op.value) }))
    }
    if (type === 'relation' && typeof o.relationTo === 'string') field.relationTo = o.relationTo
    out.push(field)
  }
  return out
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
  /** Datos saneados por el esquema (solo claves conocidas, con tipos coercidos). */
  value: Record<string, unknown>
}

/** Valida y sanea los valores de un registro contra el esquema de la colección (puro). */
export function validateItemData(fields: CollectionField[], data: unknown): ValidationResult {
  const input = (data && typeof data === 'object') ? data as Record<string, unknown> : {}
  const errors: string[] = []
  const value: Record<string, unknown> = {}

  for (const f of fields) {
    const raw = input[f.key]
    const empty = raw === undefined || raw === null || raw === ''
    if (empty) {
      if (f.required) errors.push(`El campo "${f.label}" es obligatorio.`)
      continue
    }
    switch (f.type) {
      case 'number': {
        const n = typeof raw === 'number' ? raw : Number(raw)
        if (!Number.isFinite(n)) { errors.push(`"${f.label}" debe ser numérico.`); break }
        value[f.key] = n
        break
      }
      case 'boolean':
        value[f.key] = raw === true || raw === 'true' || raw === 1 || raw === '1'
        break
      case 'date': {
        const d = new Date(String(raw))
        if (Number.isNaN(d.getTime())) { errors.push(`"${f.label}" no es una fecha válida.`); break }
        value[f.key] = String(raw)
        break
      }
      case 'select': {
        const v = String(raw)
        const opts = f.options ?? []
        if (opts.length && !opts.some((o) => o.value === v)) {
          errors.push(`"${f.label}" tiene un valor fuera de las opciones.`)
          break
        }
        value[f.key] = v
        break
      }
      default:
        // text / textarea / richtext / image / file / url / relation → string
        value[f.key] = String(raw)
    }
  }
  return { ok: errors.length === 0, errors, value }
}

/** Título legible de un registro: data.title, o el primer campo de texto con valor. */
export function deriveItemTitle(fields: CollectionField[], data: Record<string, unknown>): string | null {
  if (typeof data.title === 'string' && data.title.trim()) return data.title.trim()
  const textField = fields.find((f) => ['text', 'textarea', 'richtext'].includes(f.type) && typeof data[f.key] === 'string' && (data[f.key] as string).trim())
  return textField ? String(data[textField.key]).trim() : null
}

function toCollection(row: Record<string, unknown>): Collection {
  return { ...(row as unknown as Collection), fields: normalizeFields((row as { fields?: unknown }).fields) }
}
function toItem(row: Record<string, unknown>): CollectionItem {
  const data = (row as { data?: unknown }).data
  return { ...(row as unknown as CollectionItem), data: (data && typeof data === 'object') ? data as Record<string, unknown> : {} }
}

// ─── CRUD · colecciones ──────────────────────────────────────────────────────

export async function listCollections(db: Db, onlyEnabled = false): Promise<Collection[]> {
  let q = db.from('collections').select('*').order('order_index')
  if (onlyEnabled) q = q.eq('enabled', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((r) => toCollection(r as Record<string, unknown>))
}

export async function getCollection(key: string, db: Db): Promise<Collection | null> {
  const { data, error } = await db.from('collections').select('*').eq('key', key).maybeSingle()
  if (error) throw error
  return data ? toCollection(data as Record<string, unknown>) : null
}

export async function countCollections(db: Db): Promise<number> {
  const { count, error } = await db.from('collections').select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export interface CreateCollectionInput {
  key: string
  label: string
  label_plural?: string | null
  description?: string | null
  icon?: string | null
  fields?: CollectionField[]
  enabled?: boolean
  order_index?: number
}

export async function createCollection(input: CreateCollectionInput, db: Db): Promise<Collection> {
  const now = new Date().toISOString()
  const { data, error } = await db.from('collections').insert({
    key: slugifyCollection(input.key),
    label: input.label,
    label_plural: input.label_plural ?? null,
    description: input.description ?? null,
    icon: input.icon ?? null,
    fields: normalizeFields(input.fields) as unknown as Json,
    enabled: input.enabled ?? true,
    order_index: input.order_index ?? 0,
    created_at: now,
    updated_at: now,
  }).select().single()
  if (error) throw error
  return toCollection(data as Record<string, unknown>)
}

export type UpdateCollectionInput = Partial<Omit<CreateCollectionInput, 'key'>>

export async function updateCollection(key: string, input: UpdateCollectionInput, db: Db): Promise<Collection> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.label !== undefined) patch.label = input.label
  if (input.label_plural !== undefined) patch.label_plural = input.label_plural
  if (input.description !== undefined) patch.description = input.description
  if (input.icon !== undefined) patch.icon = input.icon
  if (input.enabled !== undefined) patch.enabled = input.enabled
  if (input.order_index !== undefined) patch.order_index = input.order_index
  if (input.fields !== undefined) patch.fields = normalizeFields(input.fields) as unknown as Json
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('collections').update(patch as any).eq('key', key).select().single()
  if (error) throw error
  return toCollection(data as Record<string, unknown>)
}

export async function deleteCollection(key: string, db: Db): Promise<void> {
  // Borra también sus registros (no hay FK CASCADE entre key↔collection_key).
  await db.from('collection_items').delete().eq('collection_key', key)
  const { error } = await db.from('collections').delete().eq('key', key)
  if (error) throw error
}

// ─── CRUD · registros ────────────────────────────────────────────────────────

export async function listCollectionItems(
  db: Db,
  opts: { collectionKey: string; onlyPublished?: boolean },
): Promise<CollectionItem[]> {
  let q = db.from('collection_items').select('*').eq('collection_key', opts.collectionKey).order('order_index')
  if (opts.onlyPublished) q = q.eq('status', 'published')
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((r) => toItem(r as Record<string, unknown>))
}

export async function getCollectionItemBySlug(
  collectionKey: string, slug: string, db: Db, onlyPublished = true,
): Promise<CollectionItem | null> {
  let q = db.from('collection_items').select('*').eq('collection_key', collectionKey).eq('slug', slug)
  if (onlyPublished) q = q.eq('status', 'published')
  const { data, error } = await q.maybeSingle()
  if (error) throw error
  return data ? toItem(data as Record<string, unknown>) : null
}

export async function countCollectionItems(collectionKey: string, db: Db): Promise<number> {
  const { count, error } = await db.from('collection_items')
    .select('id', { count: 'exact', head: true })
    .eq('collection_key', collectionKey)
  if (error) throw error
  return count ?? 0
}

export interface CreateCollectionItemInput {
  collection_key: string
  slug?: string
  status?: 'draft' | 'published'
  data?: Record<string, unknown>
  order_index?: number
}

/** Crea un registro validando `data` contra el esquema de la colección. */
export async function createCollectionItem(input: CreateCollectionItemInput, db: Db): Promise<CollectionItem> {
  const collection = await getCollection(input.collection_key, db)
  if (!collection) throw new Error('Colección no encontrada.')
  const v = validateItemData(collection.fields, input.data)
  if (!v.ok) throw new CollectionValidationError(v.errors)
  const title = deriveItemTitle(collection.fields, v.value)
  const slug = slugifyCollection(input.slug || title || `item-${Date.now()}`)
  const status = input.status === 'published' ? 'published' : 'draft'
  const now = new Date().toISOString()
  const { data, error } = await db.from('collection_items').insert({
    collection_key: input.collection_key,
    slug,
    title,
    status,
    data: v.value as unknown as Json,
    order_index: input.order_index ?? 0,
    published_at: status === 'published' ? now : null,
    created_at: now,
    updated_at: now,
  }).select().single()
  if (error) throw error
  return toItem(data as Record<string, unknown>)
}

export interface UpdateCollectionItemInput {
  slug?: string
  status?: 'draft' | 'published'
  data?: Record<string, unknown>
  order_index?: number
}

export async function updateCollectionItem(id: number, collectionKey: string, input: UpdateCollectionItemInput, db: Db): Promise<CollectionItem> {
  const collection = await getCollection(collectionKey, db)
  if (!collection) throw new Error('Colección no encontrada.')
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.data !== undefined) {
    const v = validateItemData(collection.fields, input.data)
    if (!v.ok) throw new CollectionValidationError(v.errors)
    patch.data = v.value as unknown as Json
    const title = deriveItemTitle(collection.fields, v.value)
    if (title) patch.title = title
  }
  if (input.slug !== undefined) patch.slug = slugifyCollection(input.slug)
  if (input.order_index !== undefined) patch.order_index = input.order_index
  if (input.status !== undefined) {
    patch.status = input.status === 'published' ? 'published' : 'draft'
    patch.published_at = input.status === 'published' ? new Date().toISOString() : null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.from('collection_items').update(patch as any).eq('id', id).select().single()
  if (error) throw error
  return toItem(data as Record<string, unknown>)
}

export async function deleteCollectionItem(id: number, db: Db): Promise<void> {
  const { error } = await db.from('collection_items').delete().eq('id', id)
  if (error) throw error
}

/** Error de validación de registro — los bordes API lo mapean a 422. */
export class CollectionValidationError extends Error {
  readonly code = 'COLLECTION_VALIDATION'
  constructor(readonly errors: string[]) {
    super(errors[0] ?? 'Datos inválidos')
    this.name = 'CollectionValidationError'
  }
}
