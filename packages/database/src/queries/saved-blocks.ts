/**
 * HU-358 · Biblioteca de bloques guardados — capa de datos.
 *
 * Guarda una sección configurada (tipo + columnas + estilo/settings + ítems) como
 * bloque reutilizable del tenant y la reinserta como copia editable. Snapshot puro
 * y testeable; helpers de BD lo envuelven. Scoped por tenant vía RLS (e17/60).
 */
import type { Db } from '../client'
import type { Json, PageSection, SectionItem } from '../types'
import { createPageSection, createSectionItem, getSectionItems } from './content'

/** Columnas de una sección que viajan en el snapshot (sin id/page_key/tenant/orden). */
export const SNAPSHOT_SECTION_COLS = [
  'section_type', 'title', 'subtitle', 'body', 'image_url', 'cta_label', 'cta_url', 'settings',
] as const
/** Columnas de ítem que viajan. */
export const SNAPSHOT_ITEM_COLS = [
  'item_type', 'icon', 'title', 'description', 'question', 'answer',
  'image_url', 'image_url_mobile', 'link_url', 'cta_text', 'metadata', 'order_index',
] as const

export interface SavedBlock {
  id: number
  tenant_id: string
  label: string
  section_type: string
  payload: SavedBlockPayload
  created_at: string
}

export interface SavedBlockPayload {
  [col: string]: unknown
  items?: Record<string, unknown>[]
}

function pick(row: Record<string, unknown>, cols: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of cols) if (c in row) out[c] = row[c]
  return out
}

/** Construye el snapshot de un bloque a partir de la sección + sus ítems (puro). */
export function buildSavedBlockPayload(
  section: Record<string, unknown>,
  items: Record<string, unknown>[] = [],
): SavedBlockPayload {
  return {
    ...pick(section, SNAPSHOT_SECTION_COLS),
    items: items.map((it) => pick(it, SNAPSHOT_ITEM_COLS)),
  }
}

export async function listSavedBlocks(db: Db): Promise<SavedBlock[]> {
  const { data, error } = await db.from('saved_blocks').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({ ...(r as unknown as SavedBlock), payload: toPayload((r as { payload?: unknown }).payload) }))
}

function toPayload(raw: unknown): SavedBlockPayload {
  return (raw && typeof raw === 'object') ? raw as SavedBlockPayload : {}
}

/** Guarda una sección existente (con sus ítems) como bloque reutilizable. */
export async function createSavedBlockFromSection(
  db: Db, opts: { sectionId: number; label: string; tenantId?: string },
): Promise<SavedBlock> {
  const { data: sectionRow, error: sErr } = await db.from('page_sections').select('*').eq('id', opts.sectionId).maybeSingle()
  if (sErr) throw sErr
  if (!sectionRow) throw new Error('Sección no encontrada.')
  const items = await getSectionItems(opts.sectionId, false, db).catch(() => [] as SectionItem[])
  const payload = buildSavedBlockPayload(sectionRow as Record<string, unknown>, items as unknown as Record<string, unknown>[])
  const { data, error } = await db.from('saved_blocks').insert({
    label: opts.label,
    section_type: String((sectionRow as { section_type?: unknown }).section_type ?? 'text'),
    payload: payload as unknown as Json,
    ...(opts.tenantId ? { tenant_id: opts.tenantId } : {}),
  }).select().single()
  if (error) throw error
  return { ...(data as unknown as SavedBlock), payload: toPayload((data as { payload?: unknown }).payload) }
}

export async function deleteSavedBlock(id: number, db: Db): Promise<void> {
  const { error } = await db.from('saved_blocks').delete().eq('id', id)
  if (error) throw error
}

/** Inserta un bloque guardado como una NUEVA sección (copia editable) en una página. */
export async function insertSavedBlock(
  db: Db, opts: { id: number; pageKey: string; orderIndex?: number },
): Promise<PageSection> {
  const { data: row, error } = await db.from('saved_blocks').select('*').eq('id', opts.id).maybeSingle()
  if (error) throw error
  if (!row) throw new Error('Bloque guardado no encontrado.')
  const payload = toPayload((row as { payload?: unknown }).payload)
  const created = await createPageSection({
    page_key: opts.pageKey,
    section_type: String(payload.section_type ?? (row as { section_type?: unknown }).section_type ?? 'text'),
    title: (payload.title as string) ?? null,
    subtitle: (payload.subtitle as string) ?? null,
    body: (payload.body as string) ?? null,
    image_url: (payload.image_url as string) ?? null,
    cta_label: (payload.cta_label as string) ?? null,
    cta_url: (payload.cta_url as string) ?? null,
    enabled: true,
    order_index: opts.orderIndex ?? 0,
    settings: (payload.settings && typeof payload.settings === 'object') ? payload.settings as Record<string, unknown> : {},
  }, db)

  for (const [i, it] of (payload.items ?? []).entries()) {
    await createSectionItem({
      section_id: created.id,
      item_type: (it.item_type as string) || 'card',
      icon: (it.icon as string) ?? null,
      title: (it.title as string) ?? null,
      description: (it.description as string) ?? null,
      question: (it.question as string) ?? null,
      answer: (it.answer as string) ?? null,
      image_url: (it.image_url as string) ?? null,
      image_url_mobile: (it.image_url_mobile as string) ?? null,
      link_url: (it.link_url as string) ?? null,
      cta_text: (it.cta_text as string) ?? null,
      metadata: (it.metadata && typeof it.metadata === 'object') ? it.metadata as Record<string, unknown> : {},
      enabled: true,
      order_index: typeof it.order_index === 'number' ? it.order_index : i,
    }, db).catch(() => { /* ítem inválido: se omite */ })
  }
  return created
}
