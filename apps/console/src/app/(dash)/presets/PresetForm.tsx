'use client'

import { useActionState } from 'react'
import { input, btn, mono } from '@/lib/styles'
import { savePreset, type PresetActionState } from '../../actions'

const initial: PresetActionState = { ok: false }

/** Formulario de crear/editar Preset con feedback (HU-233). */
export default function PresetForm() {
  const [state, action, pending] = useActionState(savePreset, initial)

  return (
    <form action={action} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 760 }}>
      <input style={input} name="key" placeholder="key (p.ej. cafe-basico)" required />
      <input style={input} name="name" placeholder="Nombre visible" required />
      <input style={input} name="niche" placeholder="nicho (p.ej. cafe)" required />
      <input style={input} name="template" placeholder="template (layout)" defaultValue="default" />
      <textarea style={{ ...input, gridColumn: '1 / span 2', minHeight: 44 }} name="description" placeholder="Descripción" />
      <select style={input} name="inventory_model" defaultValue="single">
        <option value="single">single</option>
        <option value="multi_location">multi_location</option>
      </select>
      <input style={input} name="available_in_plans" placeholder="planes (vacío = todos): free, pro" />
      <textarea style={{ ...input, ...mono, gridColumn: '1 / span 2', minHeight: 56 }} name="theme" placeholder='theme (objeto JSON) {"primary": "#0f766e"}' />
      <textarea style={{ ...input, ...mono, gridColumn: '1 / span 2', minHeight: 56 }} name="home_sections" placeholder="home_sections (array JSON)" />
      <textarea style={{ ...input, ...mono, gridColumn: '1 / span 2', minHeight: 56 }} name="sample_categories" placeholder="sample_categories (array JSON)" />
      <textarea style={{ ...input, ...mono, gridColumn: '1 / span 2', minHeight: 56 }} name="sample_products" placeholder="sample_products (array JSON)" />
      <select style={input} name="active" defaultValue="true">
        <option value="true">activo</option>
        <option value="false">inactivo</option>
      </select>
      <button type="submit" disabled={pending} style={{ ...btn, gridColumn: '1 / span 2' }}>
        {pending ? 'Guardando…' : 'Guardar preset'}
      </button>
      {state.error && <p style={{ gridColumn: '1 / span 2', color: '#dc2626', fontSize: 13, margin: 0 }}>{state.error}</p>}
      {state.ok && state.message && <p style={{ gridColumn: '1 / span 2', color: '#16a34a', fontSize: 13, margin: 0 }}>{state.message}</p>}
    </form>
  )
}
