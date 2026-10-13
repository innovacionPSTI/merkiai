'use client'

import { useActionState, useState } from 'react'
import { Icon, StatusBadge, Pipeline, ResourceList, ResourceItem, ResourceAction, type BadgeTone } from '@merkiai/ui'
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
  // Activo = TODOS los pasos completados (índice = longitud → ninguno "en curso").
  if (providerActive) return PIPE.length
  switch (state) {
    case 'active': return PIPE.length
    case 'propagating': return 2
    case 'certificate': return 1
    default: return 0
  }
}

// El estado que se MUESTRA se deriva del proveedor en vivo (no del flag en BD).
function displayStatus(domainStatus: string, provision: DomainState['provision']): { label: string; tone: BadgeTone } {
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

// Pasos del asistente (setup del dominio), distintos del pipeline de hosting.
const WIZARD_STEPS = ['Tu dominio', 'Registros DNS', 'Activar'] as const

export default function DominioClient({ state: initial }: { state: DomainState | null }) {
  const [reqState, reqAction] = useActionState(requestDomainAction, init)
  const [verState, verAction] = useActionState(verifyDomainAction, init)
  const [actState, actAction] = useActionState(activateDomainAction, init)
  const [rmState, rmAction] = useActionState(removeDomainAction, init)
  const [open, setOpen] = useState(false)

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
  const providerActive = provision?.active ?? false
  const pIdx = pipeIndex(provision?.state, providerActive)

  // Paso del asistente según el estado del dominio (se auto-avanza tras cada acción).
  const wizStep = initial.domain_status === 'none' ? 0
    : initial.domain_status === 'pending' ? 1
    : 2 // verified | active (contenido del cuerpo)
  // Para los puntos: si ya está activo, los 3 pasos salen completados (verde).
  const wizDots = initial.domain_status === 'active' ? WIZARD_STEPS.length : wizStep

  const Msg = ({ s }: { s: DomainActionState }) =>
    s.error ? <p className="font-brand text-sm text-red-600 mt-2">{s.error}</p>
    : s.ok && s.message ? <p className="font-brand text-sm text-green-600 mt-2">{s.message}</p> : null

  const recLabel = (r: DnsRecord) => `${r.type} · ${r.name}`

  return (
    <div>
      <ResourceList
        addLabel={inProcess ? 'Gestionar dominio' : 'Agregar dominio'}
        onAdd={() => setOpen(true)}
        isEmpty={!inProcess}
        emptyIcon="domain"
        emptyText="Aún no has conectado un dominio propio. Mientras tanto tu tienda vive en tu subdominio *.merkiai.com."
      >
        {inProcess && (
          <ResourceItem
            icon={<Icon name="domain" size={18} />}
            title={initial.primary_domain ?? (domain || '—')}
            accent={providerActive}
            badges={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
            pipeline={<Pipeline steps={PIPE} current={pIdx} error={provision?.state === 'error'} />}
            actions={<>
              <ResourceAction icon="refresh" label="Gestionar" onClick={() => setOpen(true)} />
              <form action={rmAction}>
                <ResourceAction icon="trash" label="Quitar" tone="danger" type="submit" />
              </form>
            </>}
          />
        )}
      </ResourceList>
      <Msg s={rmState} />

      {/* ── Asistente (modal) ─────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label="Configurar dominio propio">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Encabezado + pasos */}
            <div className="p-5 border-b border-brand-primary/10">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-brand-primary text-lg">{inProcess ? 'Gestionar dominio' : 'Agregar dominio'}</h2>
                <button type="button" onClick={() => setOpen(false)} className="text-brand-primary/40 hover:text-brand-primary" aria-label="Cerrar">
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {WIZARD_STEPS.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-brand ${
                      i < wizDots ? 'bg-green-600 text-white' : i === wizDots ? 'bg-brand-primary text-brand-cream' : 'bg-gray-200 text-brand-primary/50'
                    }`}>{i < wizDots ? <Icon name="check" size={12} /> : i + 1}</span>
                    <span className={`font-brand text-xs ${i === wizDots ? 'text-brand-primary font-semibold' : 'text-brand-primary/40'}`}>{label}</span>
                    {i < WIZARD_STEPS.length - 1 && <span className="text-brand-primary/20">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Cuerpo según el paso */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* Paso 1 · Tu dominio */}
              {wizStep === 0 && (
                <div>
                  <p className="font-brand text-sm text-brand-primary/50 mb-3">Ingresa el dominio que ya posees (ej. mitienda.com). Debes administrar su DNS.</p>
                  <form action={reqAction} className="flex gap-2 flex-wrap">
                    <input name="domain" defaultValue={domain} placeholder="mitienda.com"
                      className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
                    <button type="submit" className="bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors">
                      Continuar
                    </button>
                  </form>
                  <Msg s={reqState} />
                </div>
              )}

              {/* Paso 2 · Registros DNS + verificación */}
              {wizStep === 1 && (
                <div>
                  <p className="font-brand text-sm text-brand-primary/50 mb-4">
                    Crea estos registros en tu proveedor de DNS. Cuando propaguen, pulsa Verificar. El certificado HTTPS se habilita automáticamente.
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
                          <CopyRow label={recLabel(r)} value={r.name} />
                          <CopyRow label={r.type === 'CNAME' ? 'Destino' : 'Valor'} value={r.value} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <form action={verAction}>
                    <button type="submit"
                      className="border border-brand-primary text-brand-primary rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors inline-flex items-center gap-2">
                      <Icon name="refresh" size={16} /> Verificar estado
                    </button>
                  </form>
                  <Msg s={verState} />
                  <p className="font-brand text-xs text-brand-primary/40 mt-3">
                    Tip: si tu proveedor no permite un registro A en el dominio raíz, usa un ALIAS/ANAME al mismo destino. Mientras tanto tu tienda sigue en tu subdominio.
                  </p>
                </div>
              )}

              {/* Paso 3 · Activar / Activo */}
              {wizStep === 2 && (
                <div>
                  <p className="font-brand text-sm text-brand-primary/50 mb-4">
                    {providerActive
                      ? 'Tu tienda ya responde en tu dominio propio.'
                      : initial.domain_status === 'active'
                        ? 'Estamos terminando de habilitar tu dominio. Pulsa Verificar estado para comprobar la propagación; mientras tanto tu tienda sigue en tu subdominio.'
                        : 'Activa el dominio verificado como el dominio principal de tu tienda.'}
                  </p>
                  <div className="mb-4"><Pipeline steps={PIPE} current={pIdx} error={provision?.state === 'error'} /></div>
                  <form action={actAction}>
                    <input type="hidden" name="domain" value={domain} />
                    <button type="submit"
                      className={initial.domain_status === 'active'
                        ? 'border border-brand-primary/30 text-brand-primary rounded-xl px-4 py-2 font-brand text-sm hover:bg-brand-cream transition-colors inline-flex items-center gap-2'
                        : 'bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors inline-flex items-center gap-2'}>
                      <Icon name={initial.domain_status === 'active' ? 'refresh' : 'check'} size={16} />
                      {initial.domain_status === 'active' ? 'Verificar estado' : 'Activar dominio'}
                    </button>
                  </form>
                  <Msg s={actState} />
                </div>
              )}
            </div>

            {/* Pie */}
            <div className="p-5 border-t border-brand-primary/10 flex items-center justify-end">
              <button type="button" onClick={() => setOpen(false)} className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary px-3 py-2">
                {providerActive ? 'Cerrar' : 'Cerrar (continuar luego)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
