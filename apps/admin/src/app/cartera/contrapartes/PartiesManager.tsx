'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPartyAction, updatePartyAction, createConsigneeLocationAction, type ActionResult } from '../actions'
import { formatMoney } from '@merkiai/i18n'

interface PartyRow {
  id: string; name: string; email: string | null; phone: string | null; role: 'customer' | 'consignee'
  credit_limit: number | null; default_terms_days: number | null; balance: number; consigneeLocation: string | null
}
const money = (n: number) => formatMoney(n || 0)
const input = 'rounded-xl border border-brand-primary/20 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none'
const num = (v: string) => (v.trim() === '' ? null : Math.max(0, Number(v.replace(/[.\s$]/g, ''))))

export default function PartiesManager({ parties, consignmentEnabled, documentTypes = [] }: { parties: PartyRow[]; consignmentEnabled: boolean; documentTypes?: { code: string; label: string }[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer' as 'customer' | 'consignee', credit: '', terms: '', doc: '', docType: documentTypes[0]?.code ?? '' })
  const [edit, setEdit] = useState<Record<string, { credit: string; terms: string }>>({})
  const [filter, setFilter] = useState<'all' | 'customer' | 'consignee' | 'debt'>('all')

  const done = (r: ActionResult) => { setMsg(r.ok ? { ok: true, text: r.message ?? 'Listo.' } : { ok: false, text: r.error }); if (r.ok) router.refresh() }
  const rows = parties.filter((p) => filter === 'all' || (filter === 'debt' ? p.balance > 0 : p.role === filter))

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Agregar</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input className={input} placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={input} placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {/* HU-468 · tipo de documento según el país de la tienda */}
          <div className="flex gap-2">
            {documentTypes.length > 0 && (
              <select className={`${input} w-28`} aria-label="Tipo de documento" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
                {documentTypes.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            )}
            <input className={`${input} flex-1 min-w-0`} placeholder="Número de documento" value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} />
          </div>
          <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'customer' | 'consignee' })}>
            <option value="customer">Cliente</option>
            {consignmentEnabled && <option value="consignee">Aliado (consignación)</option>}
          </select>
          <input className={input} placeholder="Cupo de crédito (vacío = sin cupo)" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} />
          <input className={input} placeholder="Plazo en días (opcional)" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
          <button type="button" disabled={pending || !form.name.trim()} className="rounded-full bg-brand-primary px-5 py-2 font-brand text-sm text-white disabled:opacity-50"
            onClick={() => start(async () => {
              const r = await createPartyAction({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, party_role: form.role, credit_limit: num(form.credit), default_terms_days: num(form.terms), document_id: form.doc || undefined, document_type: form.doc ? form.docType || undefined : undefined })
              done(r); if (r.ok) setForm({ name: '', email: '', phone: '', role: form.role, credit: '', terms: '', doc: '', docType: form.docType })
            })}>Agregar</button>
        </div>
      </section>

      {msg && <p role="status" className={`font-brand text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex gap-2 border-b border-gray-100 p-3 font-brand text-sm">
          {([['all', 'Todos'], ['debt', 'Con saldo'], ['customer', 'Clientes'], ...(consignmentEnabled ? [['consignee', 'Aliados']] : [])] as Array<[typeof filter, string]>).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? 'bg-brand-primary text-white' : 'text-brand-primary/70 hover:bg-gray-50'}`}>{l}</button>
          ))}
        </div>
        {rows.length === 0 ? <p className="p-6 font-brand text-sm text-brand-primary/60">Sin registros.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full font-brand text-sm">
              <thead className="text-left text-xs text-brand-primary/50"><tr><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2 text-right">Saldo</th><th className="px-4 py-2">Cupo</th><th className="px-4 py-2">Plazo</th><th className="px-4 py-2" /></tr></thead>
              <tbody>
                {rows.map((p) => {
                  const e = edit[p.id]
                  return (
                    <tr key={p.id} className="border-t border-gray-50 align-top">
                      <td className="px-4 py-2"><Link href={`/cartera/contrapartes/${p.id}`} className="font-medium text-brand-primary hover:underline">{p.name}</Link><br /><span className="text-xs text-brand-primary/50">{[p.email, p.phone].filter(Boolean).join(' · ')}</span></td>
                      <td className="px-4 py-2 text-brand-primary/70">{p.role === 'consignee' ? <>Aliado{p.consigneeLocation ? <><br /><span className="text-xs">Ubicación: {p.consigneeLocation}</span></> : null}</> : 'Cliente'}</td>
                      <td className={`px-4 py-2 text-right ${p.balance > 0 ? 'font-semibold text-red-600' : p.balance < 0 ? 'text-green-700' : ''}`}>{money(p.balance)}</td>
                      <td className="px-4 py-2">{e ? <input className={`${input} w-32`} value={e.credit} onChange={(ev) => setEdit({ ...edit, [p.id]: { ...e, credit: ev.target.value } })} placeholder="Sin cupo" /> : (p.credit_limit != null ? money(p.credit_limit) : 'Sin cupo')}</td>
                      <td className="px-4 py-2">{e ? <input className={`${input} w-20`} value={e.terms} onChange={(ev) => setEdit({ ...edit, [p.id]: { ...e, terms: ev.target.value } })} placeholder="días" /> : (p.default_terms_days ? `${p.default_terms_days} días` : '—')}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                        {e ? (
                          <>
                            <button type="button" className="text-brand-primary underline" disabled={pending} onClick={() => start(async () => { done(await updatePartyAction(p.id, { credit_limit: num(e.credit), default_terms_days: num(e.terms) })); setEdit((x) => { const n = { ...x }; delete n[p.id]; return n }) })}>Guardar</button>
                            <button type="button" className="text-brand-primary/50" onClick={() => setEdit((x) => { const n = { ...x }; delete n[p.id]; return n })}>Cancelar</button>
                          </>
                        ) : (
                          <button type="button" className="text-brand-primary underline" onClick={() => setEdit({ ...edit, [p.id]: { credit: p.credit_limit?.toString() ?? '', terms: p.default_terms_days?.toString() ?? '' } })}>Condiciones</button>
                        )}
                        {consignmentEnabled && p.role === 'consignee' && !p.consigneeLocation && (
                          <button type="button" className="text-brand-primary underline" disabled={pending} onClick={() => start(async () => done(await createConsigneeLocationAction(p.id, p.name)))}>Crear ubicación</button>
                        )}
                        <Link href={`/cartera/nuevo?contraparte=${p.id}${p.role === 'consignee' ? '&modalidad=consignment' : ''}`} className="text-brand-primary underline">Nuevo documento</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
