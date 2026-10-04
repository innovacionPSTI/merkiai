'use client'

import { useActionState, useState } from 'react'
import { Icon, StatusBadge, type BadgeTone } from '@merkiai/ui'
import type { DomainState } from '@/lib/domains'
import { requestDomainAction, verifyDomainAction, activateDomainAction, removeDomainAction, type DomainActionState } from './actions'

const init: DomainActionState = { ok: false }

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  none:     { label: 'Sin dominio propio', tone: 'neutral' },
  pending:  { label: 'Pendiente de verificar', tone: 'warn' },
  verified: { label: 'Verificado', tone: 'info' },
  active:   { label: 'Activo', tone: 'success' },
}

function Row({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
      <div className="min-w-0">
        <p className="font-brand text-xs text-brand-primary/40">{label}</p>
        <p className="font-mono text-xs text-brand-primary break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="shrink-0 font-brand text-xs border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-white inline-flex items-center gap-1.5"
      >
        <Icon name={copied ? 'check' : 'content'} size={13} /> {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

export default function DominioClient({ state: initial }: { state: DomainState | null }) {
  const [reqState, reqAction] = useActionState(requestDomainAction, init)
  const [verState, verAction] = useActionState(verifyDomainAction, init)
  const [actState, actAction] = useActionState(activateDomainAction, init)
  const [rmState, rmAction] = useActionState(removeDomainAction, init)

  if (!initial) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="font-brand text-sm text-brand-primary/60">
          No se pudo consultar el estado del dominio (control plane). Intenta más tarde.
        </p>
      </div>
    )
  }

  const status = STATUS[initial.domain_status] ?? STATUS.none
  const domain = initial.domain_requested ?? ''
  const instr = reqState.instructions
  const canVerify = initial.domain_status === 'pending' || initial.domain_status === 'verified'
  const canActivate = initial.domain_status === 'verified'

  const Msg = ({ s }: { s: DomainActionState }) =>
    s.error ? <p className="font-brand text-sm text-red-600 mt-2">{s.error}</p>
    : s.ok && s.message ? <p className="font-brand text-sm text-green-600 mt-2">{s.message}</p> : null

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide mb-1">Estado</p>
          <p className="font-brand text-brand-primary">{initial.primary_domain ?? (domain || '—')}</p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      {/* Paso 1 · Registrar dominio */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-brand-primary text-lg mb-1">1 · Tu dominio</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">Ingresa el dominio que ya posees (ej. mitienda.com). Debes administrar su DNS.</p>
        <form action={reqAction} className="flex gap-2 flex-wrap">
          <input name="domain" defaultValue={domain} placeholder="mitienda.com"
            className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          <button type="submit" className="bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors">
            {domain ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
        <Msg s={reqState} />
      </div>

      {/* Paso 2 · Registro TXT */}
      {(instr?.txtName || initial.domain_status !== 'none') && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-brand-primary text-lg mb-1">2 · Verifica la propiedad</h2>
          <p className="font-brand text-sm text-brand-primary/50 mb-4">
            Crea este registro <strong>TXT</strong> en el DNS de tu dominio. Cuando propague, pulsa Verificar.
          </p>
          {instr?.txtName && instr?.txtValue && (
            <div className="space-y-2 mb-4">
              <Row label="Tipo / Nombre (host)" value={instr.txtName} />
              <Row label="Valor" value={instr.txtValue} />
            </div>
          )}
          <form action={verAction}>
            <button type="submit" disabled={!canVerify}
              className="border border-brand-primary text-brand-primary rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors disabled:opacity-40 inline-flex items-center gap-2">
              <Icon name="refresh" size={16} /> Verificar
            </button>
          </form>
          <Msg s={verState} />
        </div>
      )}

      {/* Paso 3 · Activar */}
      {(canActivate || initial.domain_status === 'active') && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-brand-primary text-lg mb-1">3 · Activar</h2>
          <p className="font-brand text-sm text-brand-primary/50 mb-4">
            {initial.domain_status === 'active'
              ? 'Tu tienda ya responde en tu dominio propio.'
              : 'Activa el dominio verificado como el dominio principal de tu tienda.'}
          </p>
          {initial.domain_status !== 'active' && (
            <form action={actAction}>
              <input type="hidden" name="domain" value={domain} />
              <button type="submit"
                className="bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors inline-flex items-center gap-2">
                <Icon name="check" size={16} /> Activar dominio
              </button>
            </form>
          )}
          <Msg s={actState} />
        </div>
      )}

      {/* Quitar dominio */}
      {initial.domain_status !== 'none' && (
        <form action={rmAction}>
          <button type="submit" className="font-brand text-sm text-red-500 hover:text-red-600 inline-flex items-center gap-1.5">
            <Icon name="trash" size={15} /> Quitar dominio propio
          </button>
          <Msg s={rmState} />
        </form>
      )}
    </div>
  )
}
