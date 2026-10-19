'use client'

import { useState } from 'react'
import { Icon } from '@merkiai/ui'

interface SegmentRules { min_orders?: number; min_total?: number; within_days?: number }
interface Segment { id: number; name: string; type: 'manual' | 'rules'; rules: SegmentRules; member_count?: number }
interface Campaign {
  id: number; name: string; segment_id: number | null; starts_at: string; ends_at: string
  status: 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'; offer_percent: number | null; quota: number | null
}
interface Opt { id: number; name: string }

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programada', active: 'Activa', ended: 'Finalizada', paused: 'Pausada', cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', ended: 'bg-gray-100 text-gray-500',
  paused: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700',
}

/** Estado efectivo derivado de la ventana (coherente con deriveCampaignStatus). */
function effectiveStatus(c: Campaign): string {
  if (c.status === 'paused' || c.status === 'cancelled') return c.status
  const now = Date.now()
  if (now < new Date(c.starts_at).getTime()) return 'scheduled'
  if (now >= new Date(c.ends_at).getTime()) return 'ended'
  return 'active'
}

export default function VipManager({
  initialSegments, initialCampaigns, products, categories,
}: {
  initialSegments: Segment[]; initialCampaigns: Campaign[]; products: Opt[]; categories: Opt[]
}) {
  const [tab, setTab] = useState<'segmentos' | 'campanas'>('segmentos')
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-100">
        {(['segmentos', 'campanas'] as const).map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            className={`font-brand text-sm px-4 py-2 -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-primary text-brand-primary font-semibold' : 'border-transparent text-brand-primary/50'
            }`}
          >
            {t === 'segmentos' ? 'Segmentos' : 'Campañas'}
          </button>
        ))}
      </div>
      {tab === 'segmentos'
        ? <Segmentos initial={initialSegments} />
        : <Campanas initial={initialCampaigns} segments={initialSegments} products={products} categories={categories} />}
    </div>
  )
}

// ── Segmentos ─────────────────────────────────────────────────────────────────
function Segmentos({ initial }: { initial: Segment[] }) {
  const [rows, setRows] = useState<Segment[]>(initial)
  const [name, setName] = useState('')
  const [type, setType] = useState<'manual' | 'rules'>('manual')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/segments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, rules: {} }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setRows((r) => [{ ...data.segment, member_count: 0 }, ...r]); setName('')
    } finally { setBusy(false) }
  }

  async function remove(id: number) {
    if (!confirm('¿Eliminar el segmento?')) return
    const res = await fetch(`/api/admin/segments/${id}`, { method: 'DELETE' })
    if (res.ok) setRows((r) => r.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[200px]">
          <span className="font-brand text-xs text-brand-primary/50">Nombre del segmento</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Clientes VIP"
            className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none" />
        </label>
        <label className="block">
          <span className="font-brand text-xs text-brand-primary/50">Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value as 'manual' | 'rules')}
            className="mt-1 rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none">
            <option value="manual">Manual</option>
            <option value="rules">Por reglas</option>
          </select>
        </label>
        <button type="submit" disabled={busy}
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50 inline-flex items-center gap-2">
          <Icon name="plus" size={16} /> Crear
        </button>
        {error && <p className="font-brand text-sm text-red-600 w-full">{error}</p>}
      </form>

      <div className="space-y-3">
        {rows.length === 0 && <p className="font-brand text-brand-primary/40 text-center py-8">Aún no tienes segmentos.</p>}
        {rows.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex-1">
                <p className="font-brand font-semibold text-brand-primary">{s.name}</p>
                <p className="font-brand text-xs text-brand-primary/40">
                  {s.type === 'rules' ? 'Por reglas' : 'Manual'} · {s.member_count ?? 0} miembro(s)
                </p>
              </div>
              <button onClick={() => setOpen(open === s.id ? null : s.id)}
                className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">
                {open === s.id ? 'Cerrar' : 'Gestionar'}
              </button>
              <button onClick={() => remove(s.id)} className="font-brand text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50">
                Eliminar
              </button>
            </div>
            {open === s.id && <SegmentDetail segment={s} onCount={(n) => setRows((r) => r.map((x) => x.id === s.id ? { ...x, member_count: n } : x))} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function SegmentDetail({ segment, onCount }: { segment: Segment; onCount: (n: number) => void }) {
  const [rules, setRules] = useState<SegmentRules>(segment.rules ?? {})
  const [members, setMembers] = useState<Array<{ customer_id: string; name: string | null; email: string }>>([])
  const [loaded, setLoaded] = useState(false)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch(`/api/admin/segments/${segment.id}/members`)
    if (res.ok) { const d = await res.json(); setMembers(d.members); onCount(d.members.length) }
    setLoaded(true)
  }
  if (!loaded) load()

  async function saveRules() {
    setMsg('')
    const res = await fetch(`/api/admin/segments/${segment.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules }),
    })
    setMsg(res.ok ? 'Reglas guardadas.' : 'Error al guardar.')
  }
  async function recalc() {
    setMsg('Recalculando…')
    const res = await fetch(`/api/admin/segments/${segment.id}/recalc`, { method: 'POST' })
    const d = await res.json()
    if (res.ok) { setMsg(`${d.count} miembro(s).`); load() } else setMsg(d.error ?? 'Error')
  }
  async function addMember(e: React.FormEvent) {
    e.preventDefault(); setMsg('')
    const res = await fetch(`/api/admin/segments/${segment.id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    })
    const d = await res.json()
    if (res.ok) { setEmail(''); load() } else setMsg(d.error ?? 'Error')
  }
  async function removeMember(cid: string) {
    const res = await fetch(`/api/admin/segments/${segment.id}/members?customer_id=${cid}`, { method: 'DELETE' })
    if (res.ok) setMembers((m) => m.filter((x) => x.customer_id !== cid))
  }

  const n = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? '' : v)

  return (
    <div className="border-t border-gray-100 px-5 py-4 space-y-4">
      {segment.type === 'rules' ? (
        <div className="space-y-3">
          <p className="font-brand text-sm font-semibold text-brand-primary">Reglas sobre el histórico de compras</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="font-brand text-xs text-brand-primary/50">Mín. pedidos</span>
              <input type="number" min={0} value={n(rules.min_orders)} onChange={(e) => setRules((r) => ({ ...r, min_orders: e.target.value === '' ? undefined : Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
            <label className="block"><span className="font-brand text-xs text-brand-primary/50">Gasto total mín.</span>
              <input type="number" min={0} value={n(rules.min_total)} onChange={(e) => setRules((r) => ({ ...r, min_total: e.target.value === '' ? undefined : Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
            <label className="block"><span className="font-brand text-xs text-brand-primary/50">Última compra ≤ (días)</span>
              <input type="number" min={0} value={n(rules.within_days)} onChange={(e) => setRules((r) => ({ ...r, within_days: e.target.value === '' ? undefined : Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          </div>
          <div className="flex gap-2">
            <button onClick={saveRules} className="font-brand text-xs bg-brand-primary/10 text-brand-primary rounded-full px-4 py-2 hover:bg-brand-primary/20">Guardar reglas</button>
            <button onClick={recalc} className="font-brand text-xs bg-brand-primary text-brand-cream rounded-full px-4 py-2 hover:bg-brand-dark">Recalcular miembros</button>
          </div>
        </div>
      ) : (
        <form onSubmit={addMember} className="flex flex-wrap items-end gap-2">
          <label className="block flex-1 min-w-[200px]"><span className="font-brand text-xs text-brand-primary/50">Agregar cliente por email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="cliente@correo.com"
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <button type="submit" className="font-brand text-xs bg-brand-primary text-brand-cream rounded-full px-4 py-2 hover:bg-brand-dark">Agregar</button>
        </form>
      )}

      {msg && <p className="font-brand text-xs text-brand-primary/60">{msg}</p>}

      <div>
        <p className="font-brand text-xs text-brand-primary/50 mb-2">Miembros ({members.length})</p>
        {members.length === 0 ? <p className="font-brand text-xs text-brand-primary/40">Sin miembros.</p> : (
          <ul className="divide-y divide-gray-50">
            {members.map((m) => (
              <li key={m.customer_id} className="flex items-center justify-between py-2">
                <span className="font-brand text-sm text-brand-primary">{m.name || m.email} <span className="text-brand-primary/40">· {m.email}</span></span>
                <button onClick={() => removeMember(m.customer_id)} className="font-brand text-xs text-red-600 hover:underline">Quitar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Campañas ────────────────────────────────────────────────────────────────
function Campanas({ initial, segments, products, categories }: { initial: Campaign[]; segments: Segment[]; products: Opt[]; categories: Opt[] }) {
  const [rows, setRows] = useState<Campaign[]>(initial)
  const [form, setForm] = useState({ name: '', segment_id: '', starts_at: '', ends_at: '', offer_percent: '', quota: '', product_ids: [] as number[], category_ids: [] as number[] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/vip-campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, segment_id: form.segment_id || null,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : '',
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : '',
          offer_percent: form.offer_percent, quota: form.quota,
          product_ids: form.product_ids, category_ids: form.category_ids,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setRows((r) => [data.campaign, ...r])
      setForm({ name: '', segment_id: '', starts_at: '', ends_at: '', offer_percent: '', quota: '', product_ids: [], category_ids: [] })
    } finally { setBusy(false) }
  }

  async function setStatus(id: number, status: string) {
    const res = await fetch(`/api/admin/vip-campaigns/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) setRows((r) => r.map((c) => c.id === id ? { ...c, status: status as Campaign['status'] } : c))
  }
  async function remove(id: number) {
    if (!confirm('¿Eliminar la campaña?')) return
    const res = await fetch(`/api/admin/vip-campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) setRows((r) => r.filter((c) => c.id !== id))
  }

  const [reportFor, setReportFor] = useState<number | null>(null)
  const [report, setReport] = useState<any>(null)
  const [notifyMsg, setNotifyMsg] = useState<Record<number, string>>({})
  async function notify(id: number) {
    if (!confirm('¿Enviar el aviso por correo a los miembros del segmento? No se reenvía a quien ya fue avisado.')) return
    setNotifyMsg((m) => ({ ...m, [id]: 'Enviando…' }))
    const res = await fetch(`/api/admin/vip-campaigns/${id}/notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    })
    const d = await res.json()
    setNotifyMsg((m) => ({ ...m, [id]: res.ok ? `Enviados ${d.result.sent} · omitidos ${d.result.skipped}` : (d.error ?? 'Error') }))
  }
  async function openReport(id: number) {
    if (reportFor === id) { setReportFor(null); return }
    setReportFor(id); setReport(null)
    const res = await fetch(`/api/admin/vip-campaigns/${id}/report`)
    if (res.ok) setReport((await res.json()).report)
  }

  const multi = (sel: number[], set: (v: number[]) => void, opts: Opt[], label: string) => (
    <label className="block"><span className="font-brand text-xs text-brand-primary/50">{label}</span>
      <select multiple value={sel.map(String)} onChange={(e) => set(Array.from(e.target.selectedOptions).map((o) => Number(o.value)))}
        className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm h-28">
        {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  )

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <p className="font-brand text-sm font-semibold text-brand-primary">Nueva campaña de acceso anticipado</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Nombre</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Segmento (audiencia)</span>
            <select value={form.segment_id} onChange={(e) => setForm({ ...form, segment_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm">
              <option value="">— Elige un segmento —</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Inicio</span>
            <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Fin</span>
            <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Descuento % (opcional)</span>
            <input type="number" min={0} max={100} value={form.offer_percent} onChange={(e) => setForm({ ...form, offer_percent: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Cupo de unidades (opcional)</span>
            <input type="number" min={0} value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          {multi(form.product_ids, (v) => setForm({ ...form, product_ids: v }), products, 'Productos del alcance')}
          {multi(form.category_ids, (v) => setForm({ ...form, category_ids: v }), categories, 'Categorías del alcance')}
        </div>
        <button type="submit" disabled={busy}
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50 inline-flex items-center gap-2">
          <Icon name="plus" size={16} /> Crear campaña
        </button>
        {error && <p className="font-brand text-sm text-red-600">{error}</p>}
      </form>

      <div className="space-y-3">
        {rows.length === 0 && <p className="font-brand text-brand-primary/40 text-center py-8">Aún no tienes campañas.</p>}
        {rows.map((c) => {
          const eff = effectiveStatus(c)
          const pct = (n: number) => `${Math.round(n * 100)}%`
          const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
          return (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm">
              <div className="px-5 py-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-brand font-semibold text-brand-primary">{c.name}</p>
                  <p className="font-brand text-xs text-brand-primary/40">
                    {new Date(c.starts_at).toLocaleString('es-CO')} → {new Date(c.ends_at).toLocaleString('es-CO')}
                    {c.offer_percent != null ? ` · -${c.offer_percent}%` : ''}{c.quota != null ? ` · cupo ${c.quota}` : ''}
                  </p>
                </div>
                <span className={`font-brand text-xs rounded-full px-2 py-1 ${STATUS_COLOR[eff]}`}>{STATUS_LABEL[eff]}</span>
                <button onClick={() => openReport(c.id)} className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">
                  {reportFor === c.id ? 'Ocultar reporte' : 'Reporte'}
                </button>
                {c.segment_id != null && c.status !== 'cancelled' && (
                  <button onClick={() => notify(c.id)} className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">Avisar</button>
                )}
                {c.status !== 'cancelled' && (
                  <>
                    {c.status === 'paused'
                      ? <button onClick={() => setStatus(c.id, 'scheduled')} className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">Reanudar</button>
                      : <button onClick={() => setStatus(c.id, 'paused')} className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">Pausar</button>}
                    <button onClick={() => setStatus(c.id, 'cancelled')} className="font-brand text-xs text-orange-600 border border-orange-200 rounded-full px-3 py-1 hover:bg-orange-50">Cancelar</button>
                  </>
                )}
                <button onClick={() => remove(c.id)} className="font-brand text-xs text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50">Eliminar</button>
                {notifyMsg[c.id] && <span className="font-brand text-xs text-brand-primary/60 w-full">{notifyMsg[c.id]}</span>}
              </div>
              {reportFor === c.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {!report ? <p className="font-brand text-xs text-brand-primary/50">Cargando reporte…</p> : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        ['Miembros', String(report.members)],
                        ['Participantes', String(report.participants)],
                        ['Participación', pct(report.participationRate)],
                        ['Pedidos', String(report.orders)],
                        ['Ingresos', money(report.revenue)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-brand-cream/50 px-3 py-2">
                          <p className="font-brand text-[11px] text-brand-primary/50">{k}</p>
                          <p className="font-brand text-sm font-semibold text-brand-primary">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="font-brand text-[11px] text-brand-primary/40 mt-2">Pedidos de miembros del segmento con pago aprobado dentro de la ventana.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
