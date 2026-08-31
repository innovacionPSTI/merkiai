'use client'

/**
 * FieldInput — un control de formulario por tipo de campo del contrato de
 * bloques (HU-218.3). Compartido por SectionEditor (campos de sección) e
 * ItemsEditor (campos de ítem).
 */
import type { BlockField } from '@merkiai/database'

const base =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

export default function FieldInput({
  name, field, value, onChange,
}: {
  name: string
  field: BlockField
  value: unknown
  onChange: (v: unknown) => void
}) {
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
