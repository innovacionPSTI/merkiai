'use client'

/**
 * FieldInput — un control de formulario por tipo de campo del contrato de
 * bloques (HU-218.3). Compartido por SectionEditor (campos de sección) e
 * ItemsEditor (campos de ítem).
 *
 * HU-265/266 · controles visuales para los tipos que antes eran texto plano:
 *   · image → subida con preview (ImageUpload)
 *   · color → selector de color nativo + hex
 *   · icon  → picker visual de la familia de iconos del panel
 */
import type { BlockField } from '@merkiai/database'
import { Icon, ICON_NAMES, type IconName } from '@merkiai/ui'
import { useState } from 'react'
import ImageUpload from '../ImageUpload'

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
    case 'image':
      return (
        <ImageUpload
          value={String(v)}
          onChange={(url) => onChange(url)}
          bucket="content"
          label=""
          sizeClass="h-36"
        />
      )
    case 'color':
      return <ColorField name={name} value={String(v)} onChange={onChange} placeholder={field.placeholder} />
    case 'icon':
      return <IconField value={String(v)} onChange={onChange} />
    default: // text | url
      return <input id={name} type="text" className={base} value={String(v)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
  }
}

// ── Color ─────────────────────────────────────────────────────────────────────
function ColorField({
  name, value, onChange, placeholder,
}: {
  name: string
  value: string
  onChange: (v: unknown) => void
  placeholder?: string
}) {
  // El <input type=color> exige formato #rrggbb; si el valor aún no es válido,
  // mostramos negro en el swatch pero conservamos el texto que escribe el usuario.
  const valid = /^#[0-9a-fA-F]{6}$/.test(value)
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Elegir color"
        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
        value={valid ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        id={name}
        type="text"
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '#2563eb'}
      />
    </div>
  )
}

// ── Icono ─────────────────────────────────────────────────────────────────────
function IconField({
  value, onChange,
}: {
  value: string
  onChange: (v: unknown) => void
}) {
  const [open, setOpen] = useState(false)
  const current = ICON_NAMES.includes(value as IconName) ? (value as IconName) : null

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        aria-expanded={open}
      >
        {current
          ? <><Icon name={current} size={18} /><span>{current}</span></>
          : <span className="text-slate-400">Elegir icono…</span>}
        <Icon name="chevron-right" size={16} className="ml-auto text-slate-400" />
      </button>

      {open && (
        <div className="grid grid-cols-6 gap-1 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-8">
          <button
            type="button"
            title="Sin icono"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`flex h-9 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 ${!current ? 'ring-2 ring-indigo-400' : ''}`}
          >
            —
          </button>
          {ICON_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              title={n}
              onClick={() => { onChange(n); setOpen(false) }}
              className={`flex h-9 items-center justify-center rounded hover:bg-slate-100 ${current === n ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
            >
              <Icon name={n} size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
