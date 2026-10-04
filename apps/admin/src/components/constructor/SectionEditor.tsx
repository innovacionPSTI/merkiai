'use client'

/**
 * SectionEditor — formulario auto-generado desde el contrato de bloques
 * (HU-218.3). Dado un `section_type`, pinta un campo por cada entrada de
 * `blockSchemas[type].fields` y persiste vía el CMS API genérico
 * (`PATCH /api/admin/cms/sections`). Ningún formulario hardcodeado por tipo.
 */
import { useState } from 'react'
import { getBlockSchema, resolveBlockFields, STYLE_FIELDS } from '@merkiai/database'
import { splitSectionFields } from '@/lib/section-fields'
import FieldInput from './FieldInput'
import ItemsEditor from './ItemsEditor'

// HU-253 · claves de estilo compartido + sus defaults.
const STYLE_KEYS = Object.keys(STYLE_FIELDS)
function initStyle(settings: unknown): Record<string, unknown> {
  const s = (settings && typeof settings === 'object') ? settings as Record<string, unknown> : {}
  const out: Record<string, unknown> = {}
  for (const [k, f] of Object.entries(STYLE_FIELDS)) out[k] = k in s ? s[k] : (f.default ?? '')
  return out
}

interface SectionRow {
  id: number
  section_type: string
  settings?: unknown
  enabled?: boolean
  draft?: unknown
  [k: string]: unknown
}

interface SectionEditorProps {
  section: SectionRow
  onSaved?: (updated: Record<string, unknown>) => void
  /** Notifica cualquier cambio persistido (para refrescar el preview). */
  onChange?: () => void
}

export default function SectionEditor({ section, onSaved, onChange }: SectionEditorProps) {
  const schema = getBlockSchema(section.section_type)
  // HU-128 v2: si la sección está publicada, editar "en caliente" guarda en el
  // borrador (overlay) y NO toca lo que ve el público hasta "Publicar cambios".
  const published = section.enabled === true
  // Arranca mostrando el borrador si ya existe, para seguir editándolo.
  const draftObj = (section.draft && typeof section.draft === 'object') ? section.draft as Record<string, unknown> : null
  const [values, setValues] = useState<Record<string, unknown>>(
    () => resolveBlockFields(section.section_type, draftObj ? { ...section, ...draftObj } : section),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [hasDraft, setHasDraft] = useState(!!draftObj)
  // HU-253 · estilo compartido (fondo/espaciado). Se persiste en settings.
  const [styleValues, setStyleValues] = useState<Record<string, unknown>>(
    () => initStyle(draftObj ? { ...(section.settings as object), ...draftObj } : section.settings),
  )

  if (!schema) {
    return <p className="text-sm text-slate-500">Tipo de bloque sin contrato: <code>{section.section_type}</code></p>
  }

  const fields = Object.entries(schema.fields)
  const hasItems = Boolean(schema.items)

  async function save() {
    setStatus('saving'); setErrorMsg('')
    const prevSettings = (section.settings ?? {}) as Record<string, unknown>
    const split = splitSectionFields(section.section_type, values, prevSettings)
    const columns = split.columns
    // HU-253 · fusiona el estilo compartido en settings.
    const settings = { ...split.settings, ...styleValues }
    try {
      if (published) {
        // Editar en caliente → al borrador (invisible para el público).
        const res = await fetch('/api/admin/cms/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: 'sections', id: section.id, action: 'save', patch: { ...columns, settings } }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error al guardar')
        setStatus('saved'); setHasDraft(true); onChange?.()
      } else {
        // Sección aún no publicada → se escribe en vivo (no es visible igualmente).
        const res = await fetch('/api/admin/cms/sections', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: section.id, ...columns, settings }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error al guardar')
        const updated = await res.json()
        setStatus('saved'); onSaved?.(updated); onChange?.()
      }
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function draftAction(action: 'publish' | 'discard') {
    setStatus('saving'); setErrorMsg('')
    try {
      const res = await fetch('/api/admin/cms/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'sections', id: section.id, action }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error')
      setHasDraft(false); setStatus('idle')
      onSaved?.({}); onChange?.()
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
          {fields.map(([key, field]) => (
            <div key={key} className={field.type === 'boolean' ? 'flex items-center gap-2' : ''}>
              <label htmlFor={key} className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
              <FieldInput name={key} field={field} value={values[key]} onChange={(v) => setValues((s) => ({ ...s, [key]: v }))} />
              {field.help && <p className="text-[11px] text-slate-400 mt-1">{field.help}</p>}
            </div>
          ))}

          {/* HU-253 · Estilo compartido (fondo / espaciado) */}
          <details className="rounded-lg border border-slate-200 bg-slate-50/50">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-600 select-none">Estilo de la sección</summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 pt-1">
              {STYLE_KEYS.map((key) => {
                const field = STYLE_FIELDS[key]
                return (
                  <div key={key}>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">{field.label}</label>
                    <FieldInput name={key} field={field} value={styleValues[key]} onChange={(v) => setStyleValues((s) => ({ ...s, [key]: v }))} />
                  </div>
                )
              })}
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={status === 'saving'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {status === 'saving' ? 'Guardando…' : published ? 'Guardar borrador' : 'Guardar'}
            </button>
            {hasDraft && (
              <>
                <button
                  onClick={() => draftAction('publish')}
                  disabled={status === 'saving'}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Publicar cambios
                </button>
                <button
                  onClick={() => draftAction('discard')}
                  disabled={status === 'saving'}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Descartar
                </button>
              </>
            )}
            {status === 'saved' && <span className="text-sm text-green-600">{published ? 'Guardado en borrador ✓' : 'Guardado ✓'}</span>}
            {status === 'error' && <span className="text-sm text-red-600">{errorMsg}</span>}
          </div>

          {published && (
            <p className="text-[11px] text-slate-400">
              {hasDraft
                ? 'Hay cambios en borrador visibles solo en la vista previa. «Publicar cambios» los hace públicos.'
                : 'Esta sección está publicada: tus ediciones se guardan como borrador (editar en caliente) y solo se ven en la vista previa hasta publicarlas.'}
            </p>
          )}
      </div>

      {hasItems && <ItemsEditor sectionId={section.id} sectionType={section.section_type} published={published} onChange={onChange} />}
    </div>
  )
}
