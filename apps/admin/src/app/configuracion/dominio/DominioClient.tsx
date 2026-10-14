'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, StatusBadge, ResourceList, ResourceItem, ResourceAction, type BadgeTone } from '@merkiai/ui'
import type { AdminCustomDomain, DomainProvision } from '@/lib/custom-domains'
import {
  addDomainAction, verifyDomainAction, activateDomainAction,
  setPrimaryDomainAction, removeDomainAction, domainProvisionAction,
} from './actions'

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending:  { label: 'Pendiente de verificar', tone: 'warn' },
  verified: { label: 'Verificado — apunta el DNS', tone: 'info' },
  active:   { label: 'Activo', tone: 'success' },
}

function DnsRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-primary/10 bg-brand-cream/30 px-3 py-2">
      <div className="min-w-0">
        <span className="font-brand text-[11px] font-semibold text-brand-primary/60">{label}</span>
        <p className="font-mono text-xs text-brand-primary/70 truncate">{value}</p>
      </div>
      <button type="button" className="shrink-0 font-brand text-xs text-brand-primary underline"
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200) }}>
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

export default function DominioClient({ domains }: { domains: AdminCustomDomain[] }) {
  const router = useRouter()
  const [busy, startTransition] = useTransition()
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [prov, setProv] = useState<Record<string, DomainProvision | null>>({})

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setMsg(null)
    startTransition(async () => {
      const r = await fn()
      setMsg(r.ok ? { type: 'ok', text: r.message ?? 'Listo.' } : { type: 'err', text: r.error ?? 'Error.' })
      router.refresh()
    })
  }

  async function toggleDns(id: string) {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    if (!(id in prov)) {
      const p = await domainProvisionAction(id)
      setProv((s) => ({ ...s, [id]: p }))
    }
  }

  return (
    <div>
      {adding && (
        <div className="flex flex-wrap items-end gap-3 mb-4 rounded-2xl border border-brand-primary/15 bg-brand-cream/30 p-4">
          <div className="flex-1 min-w-[220px]">
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Dominio propio</label>
            <input type="text" autoFocus value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="mitienda.com"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
          </div>
          <button type="button" disabled={busy || !newDomain.trim()}
            onClick={() => run(async () => { const r = await addDomainAction(newDomain); if (r.ok) { setNewDomain(''); setAdding(false) } return r })}
            className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50">
            Agregar
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewDomain('') }} className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary">Cancelar</button>
        </div>
      )}

      <ResourceList
        addLabel="Agregar dominio"
        onAdd={() => setAdding(true)}
        addDisabled={busy}
        isEmpty={domains.length === 0}
        emptyIcon="domain"
        emptyText="Aún no has conectado un dominio propio. Tu tienda responde en tu subdominio *.merkiai.com."
      >
        {domains.map((d) => {
          const st = STATUS[d.status] ?? STATUS.pending
          const p = prov[d.id]
          return (
            <div key={d.id}>
              <ResourceItem
                icon={<Icon name="domain" size={18} />}
                title={d.domain}
                subtitle={d.isPrimary ? 'Dominio principal (canónico)' : 'Alias'}
                accent={d.isPrimary}
                badges={<>
                  <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  {d.isPrimary && <StatusBadge tone="success">Principal</StatusBadge>}
                </>}
                actions={<>
                  <ResourceAction icon="list" label={openId === d.id ? 'Ocultar DNS' : 'Ver DNS'} onClick={() => toggleDns(d.id)} disabled={busy} />
                  {d.status === 'pending' && <ResourceAction icon="refresh" label="Verificar" tone="primary" onClick={() => run(() => verifyDomainAction(d.id))} disabled={busy} />}
                  {d.status === 'verified' && <ResourceAction icon="check" label="Activar" tone="primary" onClick={() => run(() => activateDomainAction(d.id))} disabled={busy} />}
                  {d.status !== 'pending' && !d.isPrimary && <ResourceAction icon="check" label="Hacer principal" onClick={() => run(() => setPrimaryDomainAction(d.id))} disabled={busy} />}
                  <ResourceAction icon="trash" label="Quitar" tone="danger" onClick={() => run(() => removeDomainAction(d.id))} disabled={busy} />
                </>}
              />
              {openId === d.id && (
                <div className="ml-4 mb-3 space-y-2">
                  {p === undefined && <p className="font-brand text-xs text-brand-primary/50">Cargando instrucciones…</p>}
                  {p === null && <p className="font-brand text-xs text-red-600">No se pudo cargar las instrucciones DNS.</p>}
                  {p && (
                    <>
                      {p.txtName && p.txtValue && (<>
                        <p className="font-brand text-xs font-semibold text-brand-primary/70">1 · Verifica la propiedad (TXT)</p>
                        <DnsRow label={`TXT · ${p.txtName}`} value={p.txtValue} />
                      </>)}
                      {p.provision?.records?.length ? (<>
                        <p className="font-brand text-xs font-semibold text-brand-primary/70 mt-2">2 · Apunta tu dominio</p>
                        {p.provision.records.map((r, i) => (
                          <DnsRow key={i} label={`${r.type} · ${r.name}${r.purpose ? ` (${r.purpose})` : ''}`} value={r.value} />
                        ))}
                      </>) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </ResourceList>

      {msg && <p className={`mt-4 font-brand text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
      <p className="font-brand text-xs text-brand-primary/40 mt-4">
        Tu tienda también responde en tu subdominio *.merkiai.com. El dominio principal es el canónico (URLs, correos, redirecciones); los demás activos funcionan como alias.
      </p>
    </div>
  )
}
