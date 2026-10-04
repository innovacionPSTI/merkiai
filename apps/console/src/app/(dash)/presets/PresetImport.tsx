'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { savePreset, type PresetActionState } from '../../actions'
import { input, btn } from '@/lib/styles'

const initial: PresetActionState = { ok: false }

interface Payload {
  theme?: unknown
  template?: string
  home_sections?: unknown[]
  sample_categories?: unknown[]
  sample_products?: unknown[]
  inventory_model?: string
}

/**
 * HU-256 · Importa un "preset desde tienda" (JSON exportado por el admin) y lo
 * publica como preset reutilizando `savePreset` + su validación. El operador
 * elige key/name/niche; el resto (Tema, home, inventario) viene del payload.
 */
export default function PresetImport() {
  const [state, action, pending] = useActionState(savePreset, initial)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [fileErr, setFileErr] = useState('')

  async function onFile(file: File) {
    setFileErr('')
    try {
      const raw = JSON.parse(await file.text())
      const p: Payload = raw?.kind === 'merkiai.preset-payload' ? raw.payload : raw
      if (!p || typeof p !== 'object' || !Array.isArray(p.home_sections)) {
        setFileErr('El archivo no es un preset de tienda válido (falta home_sections).')
        setPayload(null); return
      }
      setPayload(p)
    } catch {
      setFileErr('Archivo JSON inválido.')
      setPayload(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
      <label>
        <span style={{ fontSize: 13, color: 'var(--ui-muted)' }}>Archivo del preset exportado desde una tienda (.json)</span>
        <input type="file" accept="application/json,.json" style={{ ...input, width: '100%', marginTop: 4 }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f) }} />
      </label>
      {fileErr && <p style={{ color: 'var(--ui-danger)', fontSize: 13 }}>{fileErr}</p>}

      {payload && (
        <form action={action} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input style={input} name="key" placeholder="key (p.ej. cafe-boutique)" required />
            <input style={input} name="name" placeholder="Nombre visible" required />
            <input style={input} name="niche" placeholder="nicho (p.ej. cafe)" required />
          </div>
          {/* Campos tomados del payload (mismo contrato que savePreset) */}
          <input type="hidden" name="theme" value={JSON.stringify(payload.theme ?? {})} />
          <input type="hidden" name="template" value={payload.template ?? 'default'} />
          <input type="hidden" name="home_sections" value={JSON.stringify(payload.home_sections ?? [])} />
          <input type="hidden" name="sample_categories" value={JSON.stringify(payload.sample_categories ?? [])} />
          <input type="hidden" name="sample_products" value={JSON.stringify(payload.sample_products ?? [])} />
          <input type="hidden" name="inventory_model" value={payload.inventory_model ?? 'single'} />
          <input type="hidden" name="active" value="true" />
          <p style={{ fontSize: 12, color: 'var(--ui-muted)' }}>
            Se publicará con el Tema, el layout y {Array.isArray(payload.home_sections) ? payload.home_sections.length : 0} sección(es) del home del archivo.
            Disponible en todos los planes (edítalo luego si quieres restringirlo).
          </p>
          <button type="submit" style={btn} disabled={pending}>{pending ? 'Publicando…' : 'Publicar como preset'}</button>
          {state.error && <p style={{ color: 'var(--ui-danger)', fontSize: 13 }}>{state.error}</p>}
          {state.ok && state.message && <p style={{ color: 'var(--ui-success)', fontSize: 13 }}>{state.message}</p>}
        </form>
      )}
    </div>
  )
}
