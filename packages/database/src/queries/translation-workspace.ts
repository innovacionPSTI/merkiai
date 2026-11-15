/**
 * queries/translation-workspace.ts — Editor de traducciones del admin (E28 · HU-464).
 *
 * Lista el contenido traducible de la tienda con su texto original y la
 * traducción del idioma elegido, calcula la completitud y exporta/importa CSV.
 * Contenido con tabla de traducción (producto, categoría, entrada de blog,
 * página) y bloques del Constructor (`translations` JSONB en secciones e ítems).
 */
import { normalizeLocale } from '@merkiai/i18n'
import type { Db } from '../client'
import { TRANSLATABLE, saveTranslation, type TranslatableEntity, type TranslationRow } from './translations'
import { getBlockSchema } from '../blocks/schema'
import { translatableKeys } from '../blocks/localize'
import { parseCsv } from '../lib/product-import'

export type WorkspaceType = TranslatableEntity | 'section' | 'item'

export const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre', description: 'Descripción', slug: 'Enlace (slug)', seo_title: 'Título SEO', seo_desc: 'Descripción SEO',
  meta_title: 'Título SEO', meta_description: 'Descripción SEO', title: 'Título', excerpt: 'Resumen', content: 'Contenido',
  label: 'Nombre de la página', subtitle: 'Subtítulo', body: 'Texto', cta_label: 'Texto del botón', cta_text: 'Texto del botón',
  question: 'Pregunta', answer: 'Respuesta',
}

/** Campos de texto largo (el editor usa textarea). */
export const LONG_FIELDS = new Set(['description', 'content', 'excerpt', 'seo_desc', 'meta_description', 'body', 'answer', 'subtitle'])

export interface TranslationItem {
  type: WorkspaceType
  id: string
  label: string
  /** Contexto (página de la sección, tipo de bloque…). */
  context?: string
  fields: string[]
  base: Record<string, string>
  translation: Record<string, string>
  done: number
  total: number
  status: 'complete' | 'partial' | 'missing'
}

const str = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))
const filled = (v: unknown) => str(v).trim() !== ''

/**
 * Estado de un ítem: cuenta solo los campos con texto original (lo que no
 * existe en el idioma base no se exige traducir). El slug no cuenta. PURA.
 */
export function itemStatus(fields: string[], base: Record<string, string>, translation: Record<string, string>): Pick<TranslationItem, 'done' | 'total' | 'status'> {
  const relevant = fields.filter((f) => f !== 'slug' && filled(base[f]))
  const done = relevant.filter((f) => filled(translation[f])).length
  const total = relevant.length
  const status = total === 0 || done === total ? 'complete' : done === 0 ? 'missing' : 'partial'
  return { done, total, status }
}

export interface Coverage { items: number; complete: number; partial: number; missing: number; percent: number }

/** Resumen de completitud (AC-2). PURA. */
export function coverageOf(items: Array<Pick<TranslationItem, 'done' | 'total' | 'status'>>): Coverage {
  const total = items.reduce((a, i) => a + i.total, 0)
  const done = items.reduce((a, i) => a + i.done, 0)
  return {
    items: items.length,
    complete: items.filter((i) => i.status === 'complete').length,
    partial: items.filter((i) => i.status === 'partial').length,
    missing: items.filter((i) => i.status === 'missing').length,
    percent: total === 0 ? 100 : Math.round((done / total) * 100),
  }
}

const SOURCES: Record<TranslatableEntity, { table: string; labelField: string; filter?: (q: any) => any }> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  product:   { table: 'products',   labelField: 'name' },
  category:  { table: 'categories', labelField: 'name' },
  blog_post: { table: 'blog_posts', labelField: 'title' },
  // Las regiones (header/footer) y parciales no son páginas navegables.
  page:      { table: 'pages',      labelField: 'label', filter: (q) => q.neq('page_type', 'region') },
}

/** Contenido de una entidad con su traducción en `locale` (AC-1/AC-2). */
export async function listEntityTranslationItems(db: Db, entity: TranslatableEntity, locale: string): Promise<TranslationItem[]> {
  const def = TRANSLATABLE[entity]
  const src = SOURCES[entity]
  const cols = [def.idField, ...new Set([src.labelField, ...def.fields])].join(', ')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (db as any).from(src.table).select(cols).order(src.labelField)
  if (src.filter) q = src.filter(q)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Record<string, unknown>[]
  if (!rows.length) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trs } = await (db as any).from(def.table).select('*').eq('locale', locale).in(def.fk, rows.map((r) => r[def.idField]))
  const byId = new Map(((trs ?? []) as TranslationRow[]).map((t) => [String(t[def.fk]), t]))
  return rows.map((r) => {
    const id = String(r[def.idField])
    const base: Record<string, string> = {}
    const translation: Record<string, string> = {}
    const tr = byId.get(id)
    for (const f of def.fields) { base[f] = str(r[f]); translation[f] = str(tr?.[f]) }
    return { type: entity, id, label: str(r[src.labelField]) || id, fields: [...def.fields], base, translation, ...itemStatus([...def.fields], base, translation) }
  })
}

type TranslationsMap = Record<string, Record<string, unknown>>

function blockFieldValues(row: Record<string, unknown>, keys: Array<{ key: string; storage: string }>, bag: 'settings' | 'metadata') {
  const base: Record<string, string> = {}
  for (const { key, storage } of keys) base[key] = storage === 'column' ? str(row[key]) : str((row[bag] as Record<string, unknown> | null)?.[key])
  return base
}

/**
 * Secciones del Constructor (y sus ítems) con texto traducible (AC-1 bloques).
 * Solo campos de texto del schema del bloque; se omiten los que no tienen
 * texto original.
 */
export async function listBlockTranslationItems(db: Db, locale: string): Promise<TranslationItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: secs, error } = await (db as any).from('page_sections').select('*').order('page_key').order('order_index')
  if (error) throw new Error(error.message)
  const sections = (secs ?? []) as Record<string, unknown>[]
  const out: TranslationItem[] = []
  const ids = sections.map((s) => s.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: its } = ids.length ? await (db as any).from('section_items').select('*').in('section_id', ids).order('order_index') : { data: [] }
  const itemsBySection = new Map<unknown, Record<string, unknown>[]>()
  for (const it of (its ?? []) as Record<string, unknown>[]) {
    const list = itemsBySection.get(it.section_id) ?? []
    list.push(it); itemsBySection.set(it.section_id, list)
  }
  for (const s of sections) {
    const schema = getBlockSchema(str(s.section_type))
    if (!schema) continue
    const context = `${str(s.page_key)} · ${schema.label}`
    const keys = translatableKeys(schema.fields)
    const base = blockFieldValues(s, keys, 'settings')
    const fields = keys.map((k) => k.key).filter((k) => filled(base[k]))
    if (fields.length) {
      const tr = ((s.translations as TranslationsMap | null)?.[locale] ?? {}) as Record<string, unknown>
      const translation = Object.fromEntries(fields.map((f) => [f, str(tr[f])]))
      out.push({ type: 'section', id: str(s.id), label: base.title || schema.label, context, fields, base, translation, ...itemStatus(fields, base, translation) })
    }
    if (!schema.items) continue
    const ikeys = translatableKeys(schema.items.fields)
    for (const it of itemsBySection.get(s.id) ?? []) {
      const ibase = blockFieldValues(it, ikeys, 'metadata')
      const ifields = ikeys.map((k) => k.key).filter((k) => filled(ibase[k]))
      if (!ifields.length) continue
      const tr = ((it.translations as TranslationsMap | null)?.[locale] ?? {}) as Record<string, unknown>
      const translation = Object.fromEntries(ifields.map((f) => [f, str(tr[f])]))
      out.push({
        type: 'item', id: str(it.id), label: ibase.title || ibase.question || schema.items.label, context: `${context} · ${schema.items.label}`,
        fields: ifields, base: ibase, translation, ...itemStatus(ifields, ibase, translation),
      })
    }
  }
  return out
}

/** Guarda la traducción de una sección o ítem del Constructor (fusiona el idioma en `translations`). */
export async function saveBlockTranslation(db: Db, kind: 'section' | 'item', id: string | number, localeRaw: string, values: Record<string, unknown>): Promise<void> {
  const locale = normalizeLocale(localeRaw) ?? (['es', 'en'].includes(localeRaw) ? localeRaw : null)
  if (!locale) throw new Error('Idioma no soportado.')
  const table = kind === 'section' ? 'page_sections' : 'section_items'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (db as any).from(table)
  const { data, error } = await t.select('id, translations, section_type, section_id').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('El bloque no existe.')
  const current = ((data.translations ?? {}) as TranslationsMap)
  // Se fusiona con lo existente (un CSV puede traer solo algunos campos); vacío = quitar.
  const merged: Record<string, unknown> = { ...(current[locale] ?? {}), ...values }
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(merged)) if (typeof v === 'string' && v.trim()) clean[k] = v.trim()
  const next: TranslationsMap = { ...current }
  if (Object.keys(clean).length) next[locale] = clean
  else delete next[locale]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upErr } = await (db as any).from(table).update({ translations: next }).eq('id', id)
  if (upErr) throw new Error(upErr.message)
}

/** Guarda una traducción de cualquier tipo del editor. */
export async function saveWorkspaceTranslation(db: Db, tenantId: string, type: WorkspaceType, id: string, locale: string, values: Record<string, unknown>): Promise<void> {
  if (type === 'section' || type === 'item') return saveBlockTranslation(db, type, id, locale, values)
  const entityId = type === 'page' ? id : Number(id)
  return saveTranslation(db, tenantId, type, entityId, locale, values)
}

// ── CSV (AC-3) ────────────────────────────────────────────────────────────────

const CSV_HEADER = ['tipo', 'id', 'campo', 'contexto', 'original', 'traduccion'] as const

function csvCell(v: string): string {
  // Neutraliza fórmulas en hojas de cálculo (CSV injection).
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** CSV con una fila por campo traducible (texto original + traducción actual). PURA. */
export function translationsToCsv(items: TranslationItem[]): string {
  const lines = [CSV_HEADER.join(',')]
  for (const it of items) for (const f of it.fields) {
    if (!filled(it.base[f]) && f !== 'slug') continue
    lines.push([it.type, it.id, f, `${it.label}${it.context ? ` (${it.context})` : ''}`, it.base[f] ?? '', it.translation[f] ?? ''].map((c) => csvCell(String(c))).join(','))
  }
  return lines.join('\n') + '\n'
}

export interface CsvTranslationRow { type: WorkspaceType; id: string; field: string; translation: string }

const VALID_TYPES = new Set<WorkspaceType>(['product', 'category', 'blog_post', 'page', 'section', 'item'])

/** Lee el CSV del editor (columnas por nombre). Ignora filas inválidas y devuelve cuántas. PURA. */
export function csvToTranslationRows(text: string): { rows: CsvTranslationRow[]; skipped: number } {
  const table = parseCsv(text.replace(/^﻿/, ''))
  if (!table.length) return { rows: [], skipped: 0 }
  const head = table[0].map((h) => h.trim().toLowerCase())
  const ix = (n: string) => head.indexOf(n)
  const [iT, iI, iF, iR] = [ix('tipo'), ix('id'), ix('campo'), ix('traduccion')]
  if (iT < 0 || iI < 0 || iF < 0 || iR < 0) throw new Error('El archivo no tiene las columnas tipo, id, campo y traduccion.')
  const rows: CsvTranslationRow[] = []
  let skipped = 0
  for (const r of table.slice(1)) {
    if (r.every((c) => !c.trim())) continue
    const type = r[iT]?.trim() as WorkspaceType
    const id = r[iI]?.trim()
    const field = r[iF]?.trim()
    if (!VALID_TYPES.has(type) || !id || !field) { skipped++; continue }
    let translation = r[iR] ?? ''
    if (/^'[=+\-@]/.test(translation)) translation = translation.slice(1)
    rows.push({ type, id, field, translation })
  }
  return { rows, skipped }
}

/** Agrupa filas CSV por (tipo, id) → valores por campo, listos para guardar. PURA. */
export function groupCsvRows(rows: CsvTranslationRow[]): Array<{ type: WorkspaceType; id: string; values: Record<string, string> }> {
  const map = new Map<string, { type: WorkspaceType; id: string; values: Record<string, string> }>()
  for (const r of rows) {
    const k = `${r.type}:${r.id}`
    const g = map.get(k) ?? { type: r.type, id: r.id, values: {} }
    g.values[r.field] = r.translation
    map.set(k, g)
  }
  return [...map.values()]
}
