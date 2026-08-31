'use client'

/**
 * SectionEditor — formulario auto-generado desde el contrato de bloques
 * (HU-218.3). Dado un `section_type`, pinta un campo por cada entrada de
 * `blockSchemas[type].fields` y persiste vía el CMS API genérico
 * (`PATCH /api/admin/cms/sections`). Ningún formulario hardcodeado por tipo.
 */
import { useState } from 'react'
import { getBlockSchema, resolveBlockFields, type BlockField } from '@merkiai/database'
import { splitSectionFields } from '@/lib/section-fields'

interface SectionRow {
  id: number
  section_type: string
  settings?: unknown
  [k: string]: unknown
}

interface SectionEditorProps {
  section: SectionRow
  onSaved?: (updated: Record<string, unknown>) => void
}

function FieldInput({
  name, field, value, onChange,
}: {
  name: string
  field: BlockField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const base = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
  const v = value ?? ''

  switch (field.type) {
    case 'textarea':
    case 'richtext':
      return <textarea id={name} className={base} rows={3} value={String(v)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'boolean':
      return <input id={name} type="checkbox" className="h-5 w-5 rounded border-slate-300" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
    case 'number':
      return <input id={name} type="number" className={base} value={v === '' ? '' : Number(v)} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
    case 'select':
      return (
        <select id={name} className={base} value={String(v)} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    default: // text | url | image | icon | color
      return <input id={name} type="text" className={base} value={String(v)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
  }
}

export default function SectionEditor({ section, onSaved }: SectionEditorProps) {
  const schema = getBlockSchema(section.section_type)
  const [values, setValues] = useState<Record<string, unknown>>(
    () => resolveBlockFields(section.section_type, section),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!schema) {
    return <p className="text-sm text-slate-500">Tipo de bloque sin contrato: <code>{section.section_type}</code></p>
  }

  const fields = Object.entries(schema.fields)
  if (fields.length === 0) {
    return <p className="text-sm text-slate-500">Este bloque se edita por sus ítems (próximo paso). Sin campos de sección.</p>
  }

  async function save() {
    setStatus('saving'); setErrorMsg('')
    const prevSettings = (section.settings ?? {}) as Record<string, unknown>
    const { columns, settings } = splitSectionFields(section.section_type, values, prevSettings)
    try {
      const res = await fetch('/api/admin/cms/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: section.id, ...columns, settings }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error al guardar')
      const updated = await res.json()
      setStatus('saved')
      onSaved?.(updated)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  return (
    <div className="space-y-4">
      {fields.map(([key, field]) => (
        <div key={key} className={field.type === 'boolean' ? 'flex items-center gap-2' : ''}>
          <label htmlFor={key} className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
          <FieldInput name={key} field={field} value={values[key]} onChange={(v) => setValues((s) => ({ ...s, [key]: v }))} />
          {field.help && <p className="text-[11px] text-slate-400 mt-1">{field.help}</p>}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={status === 'saving'}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {status === 'saving' ? 'Guardando…' : 'Guardar'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-600">Guardado ✓</span>}
        {status === 'error' && <span className="text-sm text-red-600">{errorMsg}</span>}
      </div>
    </div>
  )
}
