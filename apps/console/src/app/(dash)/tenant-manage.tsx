'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { inviteTenantOwner, deleteTenant, type TenantActionState } from '../actions'
import { input } from '@/lib/styles'

const initial: TenantActionState = { ok: false }

function Pending({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus()
  return <>{pending ? busy : idle}</>
}

const smallBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, border: '1px solid #2E5A3B',
  background: '#fff', color: '#2E5A3B', cursor: 'pointer', fontSize: 13,
}
const dangerBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 6, border: 0,
  background: '#B42318', color: '#fff', cursor: 'pointer', fontSize: 13,
}

export default function TenantManage({
  tenant,
}: {
  tenant: { id: string; name: string; subdomain: string | null }
}) {
  const subdomain = tenant.subdomain ?? ''
  const [inviteState, inviteAction] = useActionState(inviteTenantOwner, initial)
  const [deleteState, deleteAction] = useActionState(deleteTenant, initial)
  const [showDanger, setShowDanger] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const canDelete = confirmText.trim().toLowerCase() === subdomain.toLowerCase() && subdomain !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
      {/* Dueño (super admin) */}
      <form action={inviteAction} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="hidden" name="id" value={tenant.id} />
        <input style={{ ...input, marginRight: 0, minWidth: 160 }} type="email" name="ownerEmail" placeholder="email del dueño" required />
        <button type="submit" style={smallBtn}><Pending idle="Invitar dueño" busy="Enviando…" /></button>
      </form>
      {inviteState.error && <span style={{ color: '#B42318', fontSize: 12 }}>{inviteState.error}</span>}
      {inviteState.ok && inviteState.message && <span style={{ color: '#1D7A46', fontSize: 12 }}>{inviteState.message}</span>}

      {/* Zona de peligro */}
      {!showDanger ? (
        <button type="button" onClick={() => setShowDanger(true)} style={{ ...smallBtn, borderColor: '#B42318', color: '#B42318', alignSelf: 'flex-start' }}>
          Eliminar…
        </button>
      ) : (
        <div style={{ border: '1px solid #F0C9C4', background: '#FEF3F2', borderRadius: 8, padding: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#B42318' }}>⚠ Zona de peligro</p>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#7A271A' }}>
            Esta acción es irreversible: elimina el registro del tenant y su Team. No borra los datos
            de la tienda (productos/pedidos). Para confirmar, escribe el subdominio <strong>{subdomain || '—'}</strong>.
          </p>
          <form action={deleteAction} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="hidden" name="id" value={tenant.id} />
            <input type="hidden" name="subdomain" value={subdomain} />
            <input
              name="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={subdomain}
              autoComplete="off"
              style={{ ...input, marginRight: 0, minWidth: 140 }}
            />
            <button type="submit" style={{ ...dangerBtn, opacity: canDelete ? 1 : 0.5, cursor: canDelete ? 'pointer' : 'not-allowed' }} disabled={!canDelete}>
              <Pending idle="Eliminar definitivamente" busy="Eliminando…" />
            </button>
            <button type="button" onClick={() => { setShowDanger(false); setConfirmText('') }} style={{ ...smallBtn, borderColor: '#ccc', color: '#555' }}>
              Cancelar
            </button>
          </form>
          {deleteState.error && <p style={{ margin: '6px 0 0', color: '#B42318', fontSize: 12 }}>{deleteState.error}</p>}
        </div>
      )}
    </div>
  )
}
