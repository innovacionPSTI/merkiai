'use client'

import { useActionState, useState } from 'react'
import { Icon, StatusBadge, Pipeline, ResourceItem, ResourceAction, type BadgeTone } from '@merkiai/ui'
import type { DomainState, DnsRecord, ProvisionState } from '@/lib/domains'
import { requestDomainAction, verifyDomainAction, activateDomainAction, removeDomainAction, type DomainActionState } from './actions'

const init: DomainActionState = { ok: false }

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  none:     { label: 'Sin dominio propio', tone: 'neutral' },
  pending:  { label: 'Pendiente de verificar', tone: 'warn' },
  verified: { label: 'Verificado', tone: 'info' },
  active:   { label: 'Activo', tone: 'success' },
}

// Pipeline de aprovisionamiento (abstracción de hosting; sin detalles de infra).
const PIPE = ['Validación DNS', 'Certificado', 'Propagación', 'Activo'] as const
function pipeIndex(state: ProvisionState | undefined, providerActive: boolean): number {
  if (providerActive) return 3
  switch (state) {
    case 'active': return 3
    case 'propagating': return 2
    case 'certificate': return 1
    default: return 0
  }
}

// El estado que se MUESTRA se deriva del proveedor en vivo (no del flag en BD),
// para no cantar "Activo" si el dominio aún no responde de verdad. El flag
// `domain_status` solo gobierna qué acciones se habilitan (verificar/activar).
function displayStatus(
  domainStatus: string,
  provision: DomainState['provision'],
): { label: string; tone: BadgeTone } {
  if (provision) {
    if (provision.active) return { label: 'Activo', tone: 'success' }
    switch (provision.state) {
      case 'certificate': return { label: 'Emitiendo certificado', tone: 'info' }
      case 'propagating':  return { label: 'Propagando', tone: 'info' }
      case 'error':        return { label: 'Revisa la configuración', tone: 'warn' }
      default:
        return domainStatus === 'pending'
          ? { label: 'Pendiente de verificar', tone: 'warn' }
          : { label: 'Esperando propagación DNS', tone: 'warn' }
    }
  }
  return STATUS[domainStatus] ?? STATUS.none
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
      <div className="min-w-0">
        <p className="font-brand text-xs text-brand-primary/40">{label}</p>
        <p className="font-mono text-xs text-brand-primary break-all">{value}</p>
      </div>
      <button type="button"
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="shrink-0 font-brand text-xs border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-white inline-flex items-center gap-1.5">
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
        <p className="font-brand text-sm text-brand-primary/60">No se pudo consultar el estado del dominio. Intenta más tarde.</p>
      </div>
    )
  }

  const provision = initial.provision
  const status = displayStatus(initial.domain_status, provision)
  const domain = initial.domain_requested ?? ''
  const txtName = reqState.instructions?.txtName ?? initial.txtName
  const txtValue = reqState.instructions?.txtValue ?? initial.txtValue
  const records: DnsRecord[] = provision?.records ?? []
  const inProcess = initial.domain_status !== 'none'
  const canVerify = initial.domain_status === 'pending' || initial.domain_status === 'verified'
  const canActivate = initial.domain_status === 'verified'
  // "Activo" de verdad = el proveedor lo confirma; el flag en BD no basta.
  const isActive = initial.domain_status === 'active'
  const providerActive = provision?.active ?? false
  const pIdx = pipeIndex(provision?.state, providerActive)

  const Msg = ({ s }: { s: DomainActionState }) =>
    s.error ? <p className="font-brand text-sm text-red-600 mt-2">{s.error}</p>
    : s.ok && s.message ? <p className="font-brand text-sm text-green-600 mt-2">{s.message}</p> : null

  const recLabel = (r: DnsRecord) => `${r.type} · ${r.name}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-brand-primary text-2xl mb-1">Dominio propio</h1>
        <p className="font-brand text-sm text-brand-primary/50">
          Conecta tu propio dominio a la tienda. Tu tienda también seguirá disponible en tu subdominio *.merkiai.com.
        </p>
      </div>

      {/* Estado + pipeline (tarjeta de recurso compartida) */}
      {inProcess && (
        <div>
          <ResourceItem
            icon={<Icon name="domain" size={18} />}
            title={initial.primary_domain ?? (domain || '—')}
            accent={providerActive}
            badges={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
            pipeline={<Pipeline steps={PIPE} current={pIdx} error={provision?.state === 'error'} />}
            actions={
              <form action={rmAction}>
                <ResourceAction icon="trash" label="Quitar" tone="danger" type="submit" />
              </form>
            }
          />
          <Msg s={rmState} />
        </div>
      )}

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

      {/* Paso 2 · Registros DNS (propiedad + enrutado/certificado) */}
      {inProcess && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-brand-primary text-lg mb-1">2 · Agrega estos registros en tu DNS</h2>
          <p className="font-brand text-sm text-brand-primary/50 mb-4">
            Créalos en tu proveedor de DNS. Cuando propaguen, pulsa Verificar. El certificado HTTPS se habilita automáticamente.
          </p>
          <div className="space-y-2 mb-4">
            {txtName && txtValue && (
              <>
                <p className="font-brand text-xs text-brand-primary/40">Verificación de propiedad</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CopyRow label="TXT · Nombre (host)" value={txtName} />
                  <CopyRow label="Valor" value={txtValue} />
                </div>
              </>
            )}
            {records.map((r, i) => (
              <div key={`${r.type}-${r.name}-${i}`} className="space-y-1 pt-2">
                {r.purpose && <p className="font-brand text-xs text-brand-primary/40">{r.purpose}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CopyRow label={`${recLabel(r)}`} value={r.name} />
                  <CopyRow label={r.type === 'CNAME' ? 'Destino' : 'Valor'} value={r.value} />
                </div>
              </div>
            ))}
          </div>
          <form action={verAction}>
            <button type="submit" disabled={!canVerify}
              className="border border-brand-primary text-brand-primary rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors disabled:opacity-40 inline-flex items-center gap-2">
              <Icon name="refresh" size={16} /> Verificar estado
            </button>
          </form>
          <Msg s={verState} />
          <p className="font-brand text-xs text-brand-primary/40 mt-3">
            Tip: si tu proveedor no permite un registro A en el dominio raíz, usa un ALIAS/ANAME al mismo destino. Mientras tanto tu tienda sigue en tu subdominio.
          </p>
        </div>
      )}

      {/* Paso 3 · Activar / Reintentar */}
      {(canActivate || isActive) && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-brand-primary text-lg mb-1">3 · Activar</h2>
          <p className="font-brand text-sm text-brand-primary/50 mb-4">
            {providerActive
              ? 'Tu tienda ya responde en tu dominio propio.'
              : isActive
                ? 'Estamos terminando de habilitar tu dominio. Pulsa Verificar estado para comprobar la propagación; mientras tanto tu tienda sigue en tu subdominio.'
                : 'Activa el dominio verificado como el dominio principal de tu tienda.'}
          </p>
          <form action={actAction}>
            <input type="hidden" name="domain" value={domain} />
            <button type="submit"
              className={isActive
                ? 'border border-brand-primary/30 text-brand-primary rounded-xl px-4 py-2 font-brand text-sm hover:bg-brand-cream transition-colors inline-flex items-center gap-2'
                : 'bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors inline-flex items-center gap-2'}>
              <Icon name={isActive ? 'refresh' : 'check'} size={16} /> {isActive ? 'Verificar estado' : 'Activar dominio'}
            </button>
          </form>
          <Msg s={actState} />
        </div>
      )}

    </div>
  )
}
