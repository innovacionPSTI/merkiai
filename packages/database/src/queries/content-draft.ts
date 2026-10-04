/**
 * HU-128 v2 · Borrador de contenido ya publicado (editar en caliente).
 *
 * Cada fila de `page_sections` / `section_items` puede llevar un overlay `draft`
 * (JSONB) con los cambios pendientes de las columnas editables. El público lee
 * las columnas en vivo; la vista previa (is_admin) fusiona el overlay sobre la
 * fila. "Publicar" copia el overlay a las columnas en vivo y limpia el borrador.
 *
 * La lógica de fusión es pura y testeable; los helpers de BD la envuelven.
 */
import type { Db } from '../client'
import type { PageSection, SectionItem } from '../types'

/** Columnas de una sección que pueden llevar overlay de borrador. */
export const DRAFTABLE_SECTION_COLS = [
  'title', 'subtitle', 'body', 'image_url', 'cta_label', 'cta_url', 'enabled', 'settings',
] as const

/** Columnas de un ítem que pueden llevar overlay de borrador. */
export const DRAFTABLE_ITEM_COLS = [
  'icon', 'title', 'description', 'question', 'answer', 'image_url',
  'image_url_mobile', 'link_url', 'cta_text', 'metadata', 'enabled',
] as const

/**
 * Fusiona el overlay `draft` sobre una fila, SOLO para las columnas permitidas.
 * Pura: si no hay draft, devuelve la fila intacta. Marca `has_draft` para la UI.
 */
export function applyDraft<T extends { draft?: unknown }>(
  row: T,
  allowed: readonly string[],
): T & { has_draft: boolean } {
  const draft = row.draft
  if (!draft || typeof draft !== 'object') return { ...row, has_draft: false }
  const overlay: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in (draft as Record<string, unknown>)) overlay[k] = (draft as Record<string, unknown>)[k]
  }
  return { ...row, ...overlay, has_draft: Object.keys(overlay).length > 0 }
}

/** Overlay de borrador aplicado a una sección (solo columnas permitidas). */
export function applySectionDraft(row: PageSection): PageSection & { has_draft: boolean } {
  return applyDraft(row, DRAFTABLE_SECTION_COLS)
}

/** Overlay de borrador aplicado a un ítem (solo columnas permitidas). */
export function applyItemDraft(row: SectionItem): SectionItem & { has_draft: boolean } {
  return applyDraft(row, DRAFTABLE_ITEM_COLS)
}

/** Filtra un patch a las columnas permitidas (defensa ante payloads sueltos). */
export function pickDraftable(patch: Record<string, unknown>, allowed: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of allowed) if (k in patch) out[k] = patch[k]
  return out
}

// ─── Helpers de BD ───────────────────────────────────────────────────────────

async function readDraft(table: 'page_sections' | 'section_items', id: number, db: Db): Promise<Record<string, unknown>> {
  const { data } = await db.from(table).select('draft').eq('id', id).maybeSingle()
  const d = (data as { draft?: unknown } | null)?.draft
  return d && typeof d === 'object' ? { ...(d as Record<string, unknown>) } : {}
}

/** Guarda (merge) un overlay de borrador en una sección. */
export async function saveSectionDraft(id: number, patch: Record<string, unknown>, db: Db): Promise<void> {
  const next = { ...(await readDraft('page_sections', id, db)), ...pickDraftable(patch, DRAFTABLE_SECTION_COLS) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('page_sections').update({ draft: next as any, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Publica el borrador de una sección: copia el overlay a las columnas en vivo y lo limpia. */
export async function publishSectionDraft(id: number, db: Db): Promise<void> {
  const draft = await readDraft('page_sections', id, db)
  const live = pickDraftable(draft, DRAFTABLE_SECTION_COLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('page_sections').update({ ...(live as any), draft: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Descarta el borrador de una sección (draft = null). */
export async function discardSectionDraft(id: number, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('page_sections').update({ draft: null, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

/** Guarda (merge) un overlay de borrador en un ítem. */
export async function saveItemDraft(id: number, patch: Record<string, unknown>, db: Db): Promise<void> {
  const next = { ...(await readDraft('section_items', id, db)), ...pickDraftable(patch, DRAFTABLE_ITEM_COLS) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('section_items').update({ draft: next as any, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Publica el borrador de un ítem. */
export async function publishItemDraft(id: number, db: Db): Promise<void> {
  const draft = await readDraft('section_items', id, db)
  const live = pickDraftable(draft, DRAFTABLE_ITEM_COLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('section_items').update({ ...(live as any), draft: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Descarta el borrador de un ítem. */
export async function discardItemDraft(id: number, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('section_items').update({ draft: null, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}
