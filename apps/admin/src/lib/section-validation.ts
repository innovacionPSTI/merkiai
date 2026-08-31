/**
 * Validación de secciones derivada del contrato de bloques (HU-218.4).
 *
 * Construye reglas zod a partir de `blockSchemas[type].fields` y valida el
 * payload que llega al CMS API (forma de fila: columnas + `settings`). Misma
 * fuente de verdad que el render (HU-218.2) y el editor (HU-218.3) → lo válido
 * en la web es lo válido en el admin. Este validador es además el que reusará
 * HU-222 para acotar la salida del generador de diseño por IA.
 */
import { z } from 'zod'
import { getBlockSchema, type BlockField } from '@merkiai/database'

function fieldToZod(f: BlockField): z.ZodTypeAny {
  switch (f.type) {
    case 'number':
      return z.coerce.number().refine((n) => !Number.isNaN(n), { message: 'debe ser un número' })
    case 'boolean':
      return z.coerce.boolean()
    case 'select': {
      const values = (f.options ?? []).map((o) => o.value)
      return values.length ? z.enum(values as [string, ...string[]]) : z.string()
    }
    case 'url':
      // Acepta URL absoluta o ruta relativa (/nosotros); el vacío se filtra antes.
      return z.string().refine(
        (v) => v.startsWith('/') || /^https?:\/\//.test(v),
        { message: 'debe ser una URL válida o una ruta que empiece con /' },
      )
    default: // text | textarea | richtext | image | icon | color
      return z.string()
  }
}

export interface SectionValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Valida los campos PRESENTES en el payload contra el schema del bloque.
 * Los campos ausentes o vacíos se consideran válidos (edición parcial).
 * Tipo desconocido → válido aquí (el CHECK de `page_sections.section_type` en la
 * BD es el backstop). Para IA (HU-222) se usará en modo fail-closed.
 */
export function validateSectionPayload(
  type: string,
  payload: Record<string, unknown>,
): SectionValidationResult {
  const schema = getBlockSchema(type)
  if (!schema) return { ok: true, errors: [] }

  const settings = (payload.settings ?? {}) as Record<string, unknown>
  const errors: string[] = []

  // Campos de la sección + params de la fuente de datos (p. ej. `limit`), que
  // también son configurables y viven en settings.
  const allFields: [string, BlockField][] = [
    ...Object.entries(schema.fields),
    ...Object.entries(schema.source?.params ?? {}),
  ]

  for (const [key, f] of allFields) {
    const val = f.storage === 'column' ? payload[f.key ?? key] : settings[key]
    if (val === undefined || val === null || val === '') continue // opcional
    const res = fieldToZod(f).safeParse(val)
    if (!res.success) {
      errors.push(`${f.label}: ${res.error.issues[0]?.message ?? 'valor inválido'}`)
    }
  }
  return { ok: errors.length === 0, errors }
}
