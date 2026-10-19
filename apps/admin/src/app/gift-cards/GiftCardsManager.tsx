'use client'

import { useState } from 'react'
import { Icon } from '@merkiai/ui'

interface GiftCard { id: number; code: string; initial_balance: number; balance: number; active: boolean; note: string | null; expires_at: string | null }

const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function GiftCardsManager({ initial }: { initial: GiftCard[] }) {
  const [cards, setCards] = useState<GiftCard[]>(initial)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Saldo a favor
  const [email, setEmail] = useState('')
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [credit, setCredit] = useState<{ email: string; balance: number } | null>(null)
  const [creditMsg, setCreditMsg] = useState('')

  async function issue(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/gift-cards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), note }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setCards((c) => [data.giftCard, ...c]); setAmount(''); setNote('')
    } finally { setBusy(false) }
  }
  async function toggle(c: GiftCard) {
    const res = await fetch(`/api/admin/gift-cards/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !c.active }),
    })
    if (res.ok) setCards((cs) => cs.map((x) => x.id === c.id ? { ...x, active: !x.active } : x))
  }

  async function lookup() {
    setCreditMsg('')
    const res = await fetch(`/api/admin/store-credit?email=${encodeURIComponent(email)}`)
    const d = await res.json()
    if (res.ok) setCredit({ email: d.customer.email, balance: d.balance })
    else { setCredit(null); setCreditMsg(d.error ?? 'Error') }
  }
  async function adjust(e: React.FormEvent) {
    e.preventDefault(); setCreditMsg('')
    const res = await fetch('/api/admin/store-credit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, delta: Number(delta), reason }),
    })
    const d = await res.json()
    if (res.ok) { setCredit({ email: d.customer.email, balance: d.balance }); setDelta(''); setReason(''); setCreditMsg('Saldo actualizado.') }
    else setCreditMsg(d.error ?? 'Error')
  }

  return (
    <div className="space-y-6">
      {/* Emitir gift card */}
      <form onSubmit={issue} className="bg-white rounded-2xl p-5 shadow-sm flex flex-wrap items-end gap-3">
        <label className="block"><span className="font-brand text-xs text-brand-primary/50">Monto de la gift card</span>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required
            className="mt-1 w-40 rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
        <label className="block flex-1 min-w-[200px]"><span className="font-brand text-xs text-brand-primary/50">Nota (opcional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
        <button type="submit" disabled={busy}
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50 inline-flex items-center gap-2">
          <Icon name="plus" size={16} /> Emitir
        </button>
        {error && <p className="font-brand text-sm text-red-600 w-full">{error}</p>}
      </form>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left font-brand text-xs text-brand-primary/50">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3">Emitida</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center font-brand text-brand-primary/40">Sin gift cards.</td></tr>
            ) : cards.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-brand-primary">{c.code}</td>
                <td className="px-4 py-3 font-brand text-brand-primary">{money(c.balance)} <span className="text-brand-primary/40">/ {money(c.initial_balance)}</span></td>
                <td className="px-4 py-3 font-brand text-brand-primary/60">{c.note ?? '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c)} className={`font-brand text-xs rounded-full px-2 py-1 ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.active ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Saldo a favor */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-display text-brand-primary text-lg">Saldo a favor (store credit)</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block flex-1 min-w-[220px]"><span className="font-brand text-xs text-brand-primary/50">Email del cliente</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@correo.com"
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <button onClick={lookup} type="button" className="font-brand text-sm border border-brand-primary/20 text-brand-primary rounded-full px-4 py-2 hover:bg-brand-cream">Ver saldo</button>
        </div>
        {credit && <p className="font-brand text-sm text-brand-primary">Saldo de <strong>{credit.email}</strong>: <strong>{money(credit.balance)}</strong></p>}
        <form onSubmit={adjust} className="flex flex-wrap items-end gap-2">
          <label className="block"><span className="font-brand text-xs text-brand-primary/50">Ajuste (+ abona / − descuenta)</span>
            <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} required
              className="mt-1 w-40 rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <label className="block flex-1 min-w-[180px]"><span className="font-brand text-xs text-brand-primary/50">Motivo</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ajuste manual"
              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" /></label>
          <button type="submit" className="font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-4 py-2 hover:bg-brand-dark">Aplicar</button>
        </form>
        {creditMsg && <p className="font-brand text-xs text-brand-primary/60">{creditMsg}</p>}
      </div>
    </div>
  )
}
