'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveTenantInfraSecrets, type InfraActionState } from '../../actions'
import { input, btn } from '@/lib/styles'

const initialState: InfraActionState = { ok: false }

const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ui-muted)', margin: '0 0 4px' }
const field: React.CSSProperties = { marginBottom: 10 }
const wide: React.CSSProperties = { ...input, width: '100%', marginRight: 0, boxSizing: 'border-box' }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" style={{ ...btn, opacity: pending ? 0.6 : 1 }} disabled={pending}>
      {pending ? 'Cifrando…' : 'Guardar secretos'}
    </button>
  )
}

/** Indicador "configurado / pendiente" sin revelar el valor. */
function SetTag({ set }: { set: boolean }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: set ? 'var(--ui-success)' : 'var(--ui-muted)' }}>
      {set ? '● configurado' : '○ pendiente'}
    </span>
  )
}

/**
 * Carga/rota los secretos de conexión del tenant dedicado. Write-only: nunca
 * muestra el valor guardado, solo si ya está cargado. Dejar un campo vacío no lo
 * cambia. El servidor los cifra con AWS KMS y guarda solo la referencia.
 */
export default function InfraSecretsForm({
  tenantId,
  state: current,
}: {
  tenantId: string
  state: { hasAnon: boolean; hasService: boolean; hasJwt: boolean }
}) {
  const [state, formAction] = useActionState(saveTenantInfraSecrets, initialState)

  return (
    <form action={formAction} autoComplete="off">
      <input type="hidden" name="tenant_id" value={tenantId} />

      <div style={field}>
        <label style={label} htmlFor={`anon-${tenantId}`}>
          Anon / publishable key <SetTag set={current.hasAnon} />
        </label>
        <input id={`anon-${tenantId}`} name="anon_key" type="password" style={wide} autoComplete="new-password"
          placeholder={current.hasAnon ? 'Dejar vacío para no cambiar' : 'sb_publishable_…'} />
      </div>

      <div style={field}>
        <label style={label} htmlFor={`svc-${tenantId}`}>
          Service role key <SetTag set={current.hasService} />
        </label>
        <input id={`svc-${tenantId}`} name="service_key" type="password" style={wide} autoComplete="new-password"
          placeholder={current.hasService ? 'Dejar vacío para no cambiar' : 'eyJ…'} />
      </div>

      <div style={field}>
        <label style={label} htmlFor={`jwt-${tenantId}`}>
          JWT secret <SetTag set={current.hasJwt} />
        </label>
        <input id={`jwt-${tenantId}`} name="jwt_secret" type="password" style={wide} autoComplete="new-password"
          placeholder={current.hasJwt ? 'Dejar vacío para no cambiar' : 'Legacy JWT secret de su BD'} />
      </div>

      <SubmitButton />

      {state.error && (
        <p role="alert" style={{ margin: '8px 0 0', color: '#B42318', fontSize: 13 }}>{state.error}</p>
      )}
      {state.ok && state.message && (
        <p style={{ margin: '8px 0 0', color: 'var(--ui-success)', fontSize: 13 }}>{state.message}</p>
      )}
    </form>
  )
}
