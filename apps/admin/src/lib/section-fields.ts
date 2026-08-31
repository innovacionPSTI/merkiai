/**
 * Mapeo formulario ↔ fila de `page_sections`, guiado por el contrato de bloques
 * (HU-218.3). Convierte los valores planos de un formulario (keyed por campo del
 * schema) en el payload que espera el CMS API: campos de columna aparte, y los
 * campos `settings` fusionados con los settings existentes de la sección.
 *
 * Es la única lógica no trivial del Constructor de páginas, por eso vive suelta
 * y con pruebas: el resto es render derivado del schema.
 */
import { getBlockSchema } from '@merkiai/database'

export interface SectionFieldPayload {
  /** Columnas de page_sections a actualizar (title/subtitle/cta_label/…). */
  columns: Record<string, unknown>
  /** Objeto settings resultante (fusiona existentes + editados). */
  settings: Record<string, unknown>
}

/**
 * @param type          section_type del bloque
 * @param values        valores del formulario, keyed por campo del schema
 * @param prevSettings  settings actuales de la sección (para no perder claves
 *                      ajenas al schema)
 */
export function splitSectionFields(
  type: string,
  values: Record<string, unknown>,
  prevSettings: Record<string, unknown> = {},
): SectionFieldPayload {
  const schema = getBlockSchema(type)
  const columns: Record<string, unknown> = {}
  const settings: Record<string, unknown> = { ...prevSettings }
  if (!schema) return { columns, settings }

  for (const [key, f] of Object.entries(schema.fields)) {
    if (!(key in values)) continue
    if (f.storage === 'column') columns[f.key ?? key] = values[key]
    else if (f.storage === 'settings') settings[key] = values[key]
    // 'metadata' pertenece a section_items, no a page_sections → se ignora aquí.
  }
  return { columns, settings }
}
