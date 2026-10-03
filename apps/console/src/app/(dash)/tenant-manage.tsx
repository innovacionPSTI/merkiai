'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon } from '@merkiai/ui'
import { inviteTenantOwner, deleteTenant, type TenantActionState } from '../actions'
import { input } from '@/lib/styles'

const initial: TenantActionState = { ok: false }

function Pending({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus()
  return <>{pending ? busy : idle}</>
}

const smallBtn: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 'var(--ui-radius)', border: '1px solid var(--ui-border)',
  background: 'var(--ui-surface)', color: 'var(--ui-text)', cursor: 'pointer', fontSize: 13,
}
const dangerBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 'var(--ui-radius)', border: 0,
  background: 'var(--ui-danger)', color: '#fff', cursor: 'pointer', fontSize: 13,
}

export default function TenantManage({
  tenant,
}: {
  tenant: { id: string; name: string; subdomain: string | null; ownerEmail?: string | null }
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
      <div style={{ fontSize: 12, color: 'var(--ui-muted)' }}>
        Dueño actual: <strong>{tenant.ownerEmail || '— sin asignar —'}</strong>
      </div>
      <form action={inviteAction} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="hidden" name="id" value={tenant.id} />
        <input style={{ ...input, marginRight: 0, minWidth: 160 }} type="email" name="ownerEmail" placeholder={tenant.ownerEmail ? 'cambiar dueño' : 'email del dueño'} required />
        <button type="submit" style={smallBtn}><Pending idle="Invitar dueño" busy="Enviando…" /></button>
      </form>
      {inviteState.error && <span style={{ color: 'var(--ui-danger)', fontSize: 12 }}>{inviteState.error}</span>}
      {inviteState.ok && inviteState.message && <span style={{ color: 'var(--ui-success)', fontSize: 12 }}>{inviteState.message}</span>}

      {/* Zona de peligro */}
      {!showDanger ? (
        <button type="button" onClick={() => setShowDanger(true)} style={{ ...smallBtn, borderColor: 'var(--ui-danger)', color: 'var(--ui-danger)', alignSelf: 'flex-start' }}>
          Eliminar…
        </button>
      ) : (
        <div style={{ border: '1px solid #F0C9C4', background: '#FEF3F2', borderRadius: 'var(--ui-radius)', padding: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--ui-danger)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={14} /> Zona de peligro</p>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#7A271A' }}>
            Esta acción es <strong>irreversible</strong>: des-aprovisiona TODO — datos de la tienda
            (config, contenido, catálogo, pedidos, clientes, perfiles), el Team en Stack Auth y el
            registro del tenant. Para confirmar, escribe el subdominio <strong>{subdomain || '—'}</strong>.
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
            <button type="button" onClick={() => { setShowDanger(false); setConfirmText('') }} style={smallBtn}>
              Cancelar
            </button>
          </form>
          {deleteState.error && <p style={{ margin: '6px 0 0', color: 'var(--ui-danger)', fontSize: 12 }}>{deleteState.error}</p>}
        </div>
      )}
    </div>
  )
}
