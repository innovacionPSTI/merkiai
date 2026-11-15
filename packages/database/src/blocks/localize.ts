/**
 * blocks/localize.ts — Bloques del Constructor por idioma (E28 · HU-463 AC-5).
 *
 * Los valores actuales de una sección (columnas y `settings`) y de sus ítems
 * (columnas y `metadata`) SON el idioma por defecto. Las traducciones viven en
 * `translations` (JSONB) con la forma `{ "<locale>": { "<campo>": "texto" } }`,
 * donde `<campo>` es la clave de almacenamiento (columna o clave de settings/
 * metadata). Solo se aplican a los campos traducibles del schema del bloque.
 * Sin traducción → el valor por defecto (nunca vacío). PURO.
 */
import { localeChain, normalizeLocale } from '@merkiai/i18n'
import { getBlockSchema, type BlockField } from './schema'

const TEXT_TYPES = new Set(['text', 'textarea', 'richtext'])

export function isTranslatableField(f: BlockField): boolean {
  return f.translatable ?? TEXT_TYPES.has(f.type)
}

/** Campos traducibles de un conjunto de fields: clave de almacenamiento → storage. */
export function translatableKeys(fields: Record<string, BlockField>): Array<{ key: string; storage: BlockField['storage'] }> {
  return Object.entries(fields)
    .filter(([, f]) => isTranslatableField(f))
    .map(([k, f]) => ({ key: f.storage === 'column' ? (f.key ?? k) : k, storage: f.storage }))
}

type TranslationMap = Record<string, Record<string, unknown>>

function chainFor(locale: string, defaultLocale: string): string[] {
  const def = normalizeLocale(defaultLocale) ?? defaultLocale
  return localeChain(locale).filter((t) => (t !== 'es' || locale.toLowerCase().startsWith('es')) && t !== def)
}

function pick(map: unknown, chain: string[], key: string): string | null {
  if (!map || typeof map !== 'object') return null
  for (const tag of chain) {
    const v = (map as TranslationMap)[tag]?.[key]
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return null
}

function applyTo<T extends Record<string, unknown>>(
  row: T, fields: Record<string, BlockField>, chain: string[], bag: 'settings' | 'metadata',
): T {
  const map = row.translations
  if (!map || typeof map !== 'object' || Object.keys(map as object).length === 0) return row
  const out: Record<string, unknown> = { ...row }
  let nested: Record<string, unknown> | null = null
  for (const { key, storage } of translatableKeys(fields)) {
    const v = pick(map, chain, key)
    if (v === null) continue
    if (storage === 'column') out[key] = v
    else if (storage === bag) {
      nested ??= { ...((row[bag] as Record<string, unknown>) ?? {}) }
      nested[key] = v
    }
  }
  if (nested) out[bag] = nested
  return out as T
}

/**
 * Devuelve la sección (y sus ítems) con los textos del locale pedido. En el
 * locale por defecto devuelve la misma referencia (cero costo).
 */
export function localizeSection<S extends Record<string, unknown> & { section_type?: string; items?: Array<Record<string, unknown>> }>(
  section: S, locale: string | null | undefined, defaultLocale: string,
): S {
  if (!locale || (normalizeLocale(locale) ?? locale) === (normalizeLocale(defaultLocale) ?? defaultLocale)) return section
  const schema = section.section_type ? getBlockSchema(section.section_type) : undefined
  if (!schema) return section
  const chain = chainFor(locale, defaultLocale)
  if (!chain.length) return section
  const localized = applyTo(section, schema.fields, chain, 'settings')
  if (Array.isArray(section.items) && schema.items) {
    const itemFields = schema.items.fields
    return { ...localized, items: section.items.map((it) => applyTo(it, itemFields, chain, 'metadata')) }
  }
  return localized
}
