'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveTenantInfraConfig, type InfraActionState } from '../../actions'
import { input, btn } from '@/lib/styles'

const initialState: InfraActionState = { ok: false }

/** Estado legible en el selector (etiqueta + valor). */
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'draft', label: 'Borrador (no se usa aún)' },
  { value: 'active', label: 'Activa (en uso)' },
  { value: 'rotating', label: 'Rotando llaves' },
  { value: 'disabled', label: 'Deshabilitada' },
]

export interface InfraFormValues {
  tenant_id: string
  db_ref: string
  db_url: string
  base_url: string | null
  sentry_dsn: string | null
  region: string | null
  status: string
}

const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ui-muted)', margin: '0 0 4px' }
const field: React.CSSProperties = { marginBottom: 12 }
const wide: React.CSSProperties = { ...input, width: '100%', marginRight: 0, boxSizing: 'border-box' }

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" style={{ ...btn, opacity: pending ? 0.6 : 1 }} disabled={pending}>
      {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar cliente'}
    </button>
  )
}

/**
 * Formulario simple (sin JSON) para crear o editar la infraestructura de un
 * cliente. Si `initial` viene, edita (tenant fijo); si no, es alta nueva y se
 * elige el cliente de la lista.
 */
export default function InfraForm({
  tenants,
  initial,
}: {
  tenants: { id: string; name: string | null }[]
  initial?: InfraFormValues
}) {
  const [state, formAction] = useActionState(saveTenantInfraConfig, initialState)
  const editing = !!initial

  return (
    <form action={formAction}>
      <div style={field}>
        <label style={label} htmlFor="tenant_id">Cliente</label>
        {editing ? (
          <>
            <input type="hidden" name="tenant_id" value={initial!.tenant_id} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {tenants.find((t) => t.id === initial!.tenant_id)?.name ?? initial!.tenant_id}
            </div>
          </>
        ) : (
          <select id="tenant_id" name="tenant_id" required style={wide} defaultValue="">
            <option value="" disabled>Selecciona un cliente…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name ?? t.id}</option>
            ))}
          </select>
        )}
      </div>

      <div style={field}>
        <label style={label} htmlFor="db_ref">Clave de routing</label>
        <input id="db_ref" name="db_ref" required style={wide} placeholder="ej. cliente-acme"
          defaultValue={initial?.db_ref ?? ''} />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>Identifica su base dedicada. Minúsculas, números y guiones.</p>
      </div>

      <div style={field}>
        <label style={label} htmlFor="db_url">Endpoint de la base de datos</label>
        <input id="db_url" name="db_url" required style={wide} placeholder="https://xxxx.supabase.co"
          defaultValue={initial?.db_url ?? ''} />
      </div>

      <div style={field}>
        <label style={label} htmlFor="base_url">URL base de la instancia (opcional)</label>
        <input id="base_url" name="base_url" style={wide} placeholder="https://cliente.ejemplo.com"
          defaultValue={initial?.base_url ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ ...field, flex: '1 1 220px' }}>
          <label style={label} htmlFor="sentry_dsn">DSN de monitoreo (opcional)</label>
          <input id="sentry_dsn" name="sentry_dsn" style={wide} placeholder="https://…@sentry.io/…"
            defaultValue={initial?.sentry_dsn ?? ''} />
        </div>
        <div style={{ ...field, flex: '1 1 120px' }}>
          <label style={label} htmlFor="region">Región (opcional)</label>
          <input id="region" name="region" style={wide} placeholder="ej. us-east-1"
            defaultValue={initial?.region ?? ''} />
        </div>
      </div>

      <div style={field}>
        <label style={label} htmlFor="status">Estado</label>
        <select id="status" name="status" style={wide} defaultValue={initial?.status ?? 'draft'}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <SubmitButton editing={editing} />

      {state.error && (
        <p role="alert" style={{ margin: '8px 0 0', color: '#B42318', fontSize: 13 }}>{state.error}</p>
      )}
      {state.ok && state.message && (
        <p style={{ margin: '8px 0 0', color: 'var(--ui-success)', fontSize: 13 }}>{state.message}</p>
      )}
    </form>
  )
}
