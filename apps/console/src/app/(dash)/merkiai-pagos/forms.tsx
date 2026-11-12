'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveMerkiaiAccount, savePlanFeeTerms, type PagosActionState } from '../../actions'
import { input, btn } from '@/lib/styles'

const init: PagosActionState = { ok: false }
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ui-muted)', margin: '0 0 4px' }
const wide: React.CSSProperties = { ...input, width: '100%', marginRight: 0, boxSizing: 'border-box' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }

function Submit({ text }: { text: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" style={{ ...btn, opacity: pending ? 0.6 : 1 }} disabled={pending}>{pending ? 'Guardando…' : text}</button>
}
function Feedback({ s }: { s: PagosActionState }) {
  if (s.error) return <p role="alert" style={{ color: '#B42318', fontSize: 13, margin: '8px 0 0' }}>{s.error}</p>
  if (s.ok && s.message) return <p role="status" style={{ color: 'var(--ui-success)', fontSize: 13, margin: '8px 0 0' }}>{s.message}</p>
  return null
}

/** Tarifa de un plan: % y valor fijo en pesos. */
export function PlanFeeForm({ plan, planName, pct, fixedPesos }: { plan: string; planName: string; pct: number; fixedPesos: number }) {
  const [s, action] = useActionState(savePlanFeeTerms, init)
  return (
    <form action={action} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <input type="hidden" name="plan" value={plan} />
      <strong style={{ minWidth: 120, paddingBottom: 8 }}>{planName}</strong>
      <div><label style={label}>% por venta</label><input name="fee_pct" defaultValue={pct} inputMode="decimal" style={{ ...input, width: 90 }} /></div>
      <div><label style={label}>+ fijo (COP)</label><input name="fee_fixed" defaultValue={fixedPesos} inputMode="numeric" style={{ ...input, width: 110 }} /></div>
      <Submit text="Guardar" />
      <Feedback s={s} />
    </form>
  )
}

export interface AccountDefaults {
  tenantId?: string
  shopId?: string
  status?: 'pending' | 'active' | 'disabled'
  hasPassword?: boolean
  pctOverride?: number | null
  fixedOverridePesos?: number | null
}

/** Alta/edición de la tienda PayZen gestionada de un tenant. Contraseña write-only. */
export function AccountForm({ tenants, d = {} }: { tenants: { id: string; name: string }[]; d?: AccountDefaults }) {
  const [s, action] = useActionState(saveMerkiaiAccount, init)
  const editing = Boolean(d.tenantId)
  return (
    <form action={action} autoComplete="off">
      <div style={grid}>
        <div>
          <label style={label}>Tienda</label>
          {editing ? (
            <><input type="hidden" name="tenant_id" value={d.tenantId} /><input value={tenants.find((t) => t.id === d.tenantId)?.name ?? d.tenantId} disabled style={wide} /></>
          ) : (
            <select name="tenant_id" style={wide} defaultValue="">
              <option value="" disabled>Elige una tienda…</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
        <div><label style={label}>Id de tienda PayZen</label><input name="shop_id" defaultValue={d.shopId ?? ''} inputMode="numeric" placeholder="12345678" style={wide} /></div>
        <div>
          <label style={label}>Contraseña REST {d.hasPassword ? <span style={{ color: 'var(--ui-success)' }}>● configurada</span> : <span>○ pendiente</span>}</label>
          <input name="password" type="password" autoComplete="new-password" placeholder={d.hasPassword ? 'Dejar vacío para no cambiar' : 'testpassword_… / prodpassword_…'} style={wide} />
        </div>
        <div>
          <label style={label}>Estado</label>
          <select name="status" defaultValue={d.status ?? 'pending'} style={wide}>
            <option value="pending">En alta (aún no cobra)</option>
            <option value="active">Activa</option>
            <option value="disabled">Desactivada</option>
          </select>
        </div>
        <div><label style={label}>% propio (opcional)</label><input name="fee_pct_override" defaultValue={d.pctOverride ?? ''} placeholder="Usa el del plan" inputMode="decimal" style={wide} /></div>
        <div><label style={label}>Fijo propio COP (opcional)</label><input name="fee_fixed_override" defaultValue={d.fixedOverridePesos ?? ''} placeholder="Usa el del plan" inputMode="numeric" style={wide} /></div>
      </div>
      <div style={{ marginTop: 12 }}><Submit text={editing ? 'Guardar cambios' : 'Agregar tienda'} /></div>
      <Feedback s={s} />
    </form>
  )
}
