'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveHostingToken, type PagosActionState } from '../../actions'
import { input, btn } from '@/lib/styles'

const init: PagosActionState = { ok: false }

function Submit() {
  const { pending } = useFormStatus()
  return <button type="submit" style={{ ...btn, opacity: pending ? 0.6 : 1 }} disabled={pending}>{pending ? 'Cifrando…' : 'Guardar token'}</button>
}

/** Token de la API de Cloudflare (write-only): se cifra en el vault. */
export default function HostingTokenForm({ configured }: { configured: boolean }) {
  const [s, action] = useActionState(saveHostingToken, init)
  return (
    <form action={action} autoComplete="off" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 320px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ui-muted)', margin: '0 0 4px' }}>
          Token de la API de Cloudflare {configured ? <span style={{ color: 'var(--ui-success)' }}>● configurado</span> : <span>○ pendiente</span>}
        </label>
        <input name="token" type="password" autoComplete="new-password" placeholder={configured ? 'Dejar vacío no cambia nada; pega uno nuevo para rotarlo' : 'Token con permiso SSL and Certificates: Edit sobre la zona'}
          style={{ ...input, width: '100%', marginRight: 0, boxSizing: 'border-box' }} />
      </div>
      <Submit />
      {s.error && <p role="alert" style={{ color: '#B42318', fontSize: 13, margin: 0, width: '100%' }}>{s.error}</p>}
      {s.ok && s.message && <p role="status" style={{ color: 'var(--ui-success)', fontSize: 13, margin: 0, width: '100%' }}>{s.message}</p>}
    </form>
  )
}
