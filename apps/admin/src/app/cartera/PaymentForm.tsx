'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerPaymentAction } from './actions'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

const input = 'rounded-xl border border-brand-primary/20 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none'

/**
 * Registrar un abono (E27). Con `documentId` se imputa primero a ese documento
 * (y opcionalmente a una línea); sin él va a la cuenta corriente (más antiguo
 * primero). La llave de operación evita duplicar si se hace doble clic.
 */
export default function PaymentForm({ partyId, documentId, lines, suggested }: {
  partyId: string; documentId?: number; lines?: Array<{ id: number; description: string }>; suggested?: number
}) {
  const tx = useTx()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [amount, setAmount] = useState(suggested && suggested > 0 ? suggested : 0)
  const [method, setMethod] = useState<'cash' | 'transfer' | 'card' | 'other'>('cash')
  const [reference, setReference] = useState('')
  const [lineId, setLineId] = useState<number | ''>('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const opKey = useRef(`pay-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  function submit() {
    start(async () => {
      const r = await registerPaymentAction({
        party_id: partyId, amount, method, reference: reference || undefined,
        document_id: documentId ?? null, line_id: lineId === '' ? null : lineId, op_key: opKey.current,
      })
      setMsg(r.ok ? { ok: true, text: r.message ?? 'Abono registrado.' } : { ok: false, text: r.error })
      if (r.ok) { opKey.current = `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`; setAmount(0); setReference(''); router.refresh() }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="font-brand text-xs text-brand-primary/70"><T>Valor</T><br />
          <input type="number" min={0} className={`${input} w-36`} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} />
        </label>
        <label className="font-brand text-xs text-brand-primary/70"><T>Medio</T><br />
          <select className={input} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="other">Otro</option>
          </select>
        </label>
        <label className="font-brand text-xs text-brand-primary/70"><T>Referencia</T><br />
          <input className={`${input} w-40`} placeholder={tx("Opcional")} value={reference} onChange={(e) => setReference(e.target.value)} />
        </label>
        {lines && lines.length > 1 && (
          <label className="font-brand text-xs text-brand-primary/70"><T>Abonar a</T><br />
            <select className={input} value={lineId} onChange={(e) => setLineId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Todo el documento</option>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.description}</option>)}
            </select>
          </label>
        )}
        <button type="button" onClick={submit} disabled={pending || !(amount > 0)} className="rounded-full bg-brand-primary px-5 py-2 font-brand text-sm text-white disabled:opacity-50">
          {pending ? 'Registrando…' : 'Registrar abono'}
        </button>
      </div>
      {msg && <p role="status" className={`font-brand text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  )
}
