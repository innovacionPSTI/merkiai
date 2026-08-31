/**
 * Mapeo formulario ↔ fila de `section_items`, guiado por el contrato de bloques
 * (HU-218.3b). Análogo a section-fields.ts pero para ítems repetibles.
 *
 * Storage de un campo de ítem:
 *   'column'   → columna de section_items (icon/title/description/image_url/…)
 *   'metadata' → dentro de section_items.metadata (JSONB) (bg_color/rating/role)
 */
import { getBlockSchema, type BlockField } from '@merkiai/database'

export interface ItemFieldPayload {
  columns: Record<string, unknown>
  metadata: Record<string, unknown>
}

/** Campos de ítem del bloque (vacío si el tipo no tiene ítems). */
export function itemFields(type: string): [string, BlockField][] {
  const schema = getBlockSchema(type)
  return schema?.items ? Object.entries(schema.items.fields) : []
}

/** item_type que agrupa los ítems de este bloque (p. ej. 'slide', 'service'). */
export function itemTypeOf(type: string): string | null {
  return getBlockSchema(type)?.items?.itemType ?? null
}

/**
 * Divide los valores del formulario en columnas vs metadata, fusionando la
 * metadata previa (para no perder claves ajenas al schema).
 */
export function splitItemFields(
  type: string,
  values: Record<string, unknown>,
  prevMetadata: Record<string, unknown> = {},
): ItemFieldPayload {
  const columns: Record<string, unknown> = {}
  const metadata: Record<string, unknown> = { ...prevMetadata }
  for (const [key, f] of itemFields(type)) {
    if (!(key in values)) continue
    if (f.storage === 'metadata') metadata[key] = values[key]
    else columns[key] = values[key] // 'column' (los ítems no usan 'settings')
  }
  return { columns, metadata }
}

/** Valores iniciales del formulario de un ítem, leídos según su storage. */
export function resolveItemFields(
  type: string,
  item?: Record<string, unknown> | null,
): Record<string, unknown> {
  const metadata = (item?.metadata ?? {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, f] of itemFields(type)) {
    let v = f.storage === 'metadata' ? metadata[key] : item?.[key]
    if (v === undefined || v === null) v = f.default ?? ''
    out[key] = v
  }
  return out
}
