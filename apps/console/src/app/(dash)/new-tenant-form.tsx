'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createTenant, type CreateTenantState } from '../actions'
import { input, btn } from '@/lib/styles'

const initialState: CreateTenantState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" style={{ ...btn, opacity: pending ? 0.6 : 1 }} disabled={pending}>
      {pending ? 'Creando…' : 'Crear'}
    </button>
  )
}

export default function NewTenantForm({ plans }: { plans: { key: string; name: string }[] }) {
  const [state, formAction] = useActionState(createTenant, initialState)

  return (
    <>
      <form action={formAction} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <input style={input} name="name" placeholder="Nombre del negocio" required />
        <input style={input} name="subdomain" placeholder="subdominio (a-z, 0-9, -)" required />
        <input style={input} name="ownerEmail" type="email" placeholder="email del dueño (opcional)" />
        <select name="plan" defaultValue="free" style={input} aria-label="Plan">
          {plans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>
        <SubmitButton />
      </form>

      {/* Feedback (antes: el error se tragaba en silencio — HU-209/HU-211) */}
      {state.error && (
        <p role="alert" style={{ margin: '8px 0 0', color: '#B42318', fontSize: 13 }}>
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p style={{ margin: '8px 0 0', color: '#1D7A46', fontSize: 13 }}>{state.message}</p>
      )}
      {state.warnings?.map((w, i) => (
        <p key={i} style={{ margin: '6px 0 0', color: '#B54708', fontSize: 12 }}>
          ⚠ {w}
        </p>
      ))}

      <p style={{ margin: '8px 0 0', color: '#888', fontSize: 12 }}>
        Crea el Team en Stack Auth + invita al dueño (si hay email). El tenant nace con el plan
        elegido (por defecto <code>free</code>). Si el Team falla, el tenant queda en modo parcial y
        el Team se adjunta luego.
      </p>
    </>
  )
}
