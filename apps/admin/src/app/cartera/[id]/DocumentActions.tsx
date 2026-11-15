'use client'

/**
 * Acciones del documento según su modalidad (E27):
 *  · encargo / crédito → registrar entrega (respeta la política de entrega)
 *  · consignación      → registrar venta del aliado / devolución
 *  · todos             → ajustar, castigar, anular (con confirmación en línea)
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deliverAction, paymentLinkAction, productionAction, reportSaleAction, returnConsignmentAction, voidAction, writeOffAction, adjustAction, type ActionResult } from '../actions'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface LineRef { id: number; description: string; pendingDelivery: number; consignAvailable: number; isItem?: boolean }
const input = 'rounded-xl border border-brand-primary/20 px-3 py-1.5 font-brand text-sm focus:border-brand-primary focus:outline-none'
const btn = 'rounded-full border border-brand-primary/30 px-4 py-1.5 font-brand text-sm text-brand-primary hover:border-brand-primary disabled:opacity-50'

export default function DocumentActions({ documentId, modality, balance, policy, lines, locations }: {
  documentId: number; modality: string; balance: number; policy: string; lines: LineRef[]; locations: Array<{ id: number; name: string }>
}) {
  const tx = useTx()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [qty, setQty] = useState<Record<number, number>>({})
  const [loc, setLoc] = useState<number | ''>(locations[0]?.id ?? '')
  const [panel, setPanel] = useState<'' | 'void' | 'writeoff' | 'adjust'>('')
  const [note, setNote] = useState('')
  const [delta, setDelta] = useState(0)
  const [refund, setRefund] = useState<'store_credit' | 'refund'>('store_credit')

  const done = (r: ActionResult) => {
    setMsg(r.ok ? { ok: true, text: r.message ?? 'Listo.' } : { ok: false, text: r.error })
    if (r.ok) { setQty({}); setPanel(''); setNote(''); router.refresh() }
  }
  const setLineQty = (id: number, v: number) => setQty((q) => ({ ...q, [id]: Math.max(0, v) }))

  const deliverable = lines.filter((l) => l.pendingDelivery > 0)
  const consignable = lines.filter((l) => l.consignAvailable > 0)

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
      {(modality === 'special_order' || modality === 'credit_sale') && deliverable.length > 0 && (
        <div className="space-y-2">
          <p className="font-brand text-sm font-semibold text-brand-primary"><T>Registrar entrega</T></p>
          {policy === 'require_full_payment' && balance > 0 && (
            <p className="font-brand text-xs text-amber-700"><T>Este encargo exige el pago completo antes de entregar.</T></p>
          )}
          {deliverable.map((l) => (
            <div key={l.id} className="flex items-center gap-2 font-brand text-sm">
              <span className="w-64 truncate text-brand-primary">{l.description}</span>
              <input type="number" min={0} max={l.pendingDelivery} className={`${input} w-24`} value={qty[l.id] ?? ''} placeholder={`máx ${l.pendingDelivery}`} onChange={(e) => setLineQty(l.id, Number(e.target.value))} />
              <button type="button" className="text-xs text-brand-primary/60 underline" onClick={() => setLineQty(l.id, l.pendingDelivery)}><T>Todo</T></button>
              {modality === 'special_order' && l.isItem && (
                <button type="button" className="text-xs text-brand-primary underline" disabled={pending} onClick={() => start(async () => done(await productionAction(documentId, l.id)))}><T>Crear orden de producción</T></button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            {locations.length > 0 && (
              <select className={input} value={loc} onChange={(e) => setLoc(e.target.value ? Number(e.target.value) : '')}>
                {locations.map((l) => <option key={l.id} value={l.id}>Desde {l.name}</option>)}
              </select>
            )}
            <button type="button" className={btn} disabled={pending || !Object.values(qty).some((v) => v > 0)}
              onClick={() => start(async () => done(await deliverAction(documentId, Object.entries(qty).filter(([, v]) => v > 0).map(([id, v]) => ({ line_id: Number(id), qty: v })), loc === '' ? null : Number(loc))))}>
              <T>Registrar entrega</T>
            </button>
          </div>
        </div>
      )}

      {modality === 'consignment' && consignable.length > 0 && (
        <div className="space-y-2">
          <p className="font-brand text-sm font-semibold text-brand-primary"><T>Ventas y devoluciones del aliado</T></p>
          {consignable.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 font-brand text-sm">
              <span className="w-56 truncate text-brand-primary">{l.description} <span className="text-brand-primary/50">({l.consignAvailable} en su poder)</span></span>
              <input type="number" min={0} max={l.consignAvailable} className={`${input} w-24`} value={qty[l.id] ?? ''} placeholder={tx("Cantidad")} onChange={(e) => setLineQty(l.id, Number(e.target.value))} />
              <button type="button" className={btn} disabled={pending || !(qty[l.id] > 0)} onClick={() => start(async () => done(await reportSaleAction(documentId, l.id, qty[l.id])))}><T>Vendió</T></button>
              <button type="button" className={btn} disabled={pending || !(qty[l.id] > 0) || loc === ''} onClick={() => start(async () => done(await returnConsignmentAction(documentId, l.id, qty[l.id], Number(loc))))}><T>Devolvió</T></button>
            </div>
          ))}
          {locations.length > 0 && (
            <label className="font-brand text-xs text-brand-primary/70">Las devoluciones ingresan a{' '}
              <select className={input} value={loc} onChange={(e) => setLoc(e.target.value ? Number(e.target.value) : '')}>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {balance > 0 && (
          <button type="button" className={btn} disabled={pending} onClick={() => start(async () => {
            const r = await paymentLinkAction(documentId)
            if (r.ok && r.message) {
              await navigator.clipboard?.writeText(r.message).catch(() => undefined)
              setMsg({ ok: true, text: `Enlace de pago copiado: ${r.message}` })
            } else if (!r.ok) setMsg({ ok: false, text: r.error })
          })}><T>Enlace de pago</T></button>
        )}
        <button type="button" className={btn} onClick={() => setPanel(panel === 'adjust' ? '' : 'adjust')}><T>Ajustar</T></button>
        {balance > 0 && <button type="button" className={btn} onClick={() => setPanel(panel === 'writeoff' ? '' : 'writeoff')}><T>Castigar saldo</T></button>}
        <button type="button" className={`${btn} border-red-300 text-red-700`} onClick={() => setPanel(panel === 'void' ? '' : 'void')}><T>Anular</T></button>
      </div>
      {panel === 'adjust' && (
        <div className="flex flex-wrap items-end gap-2 font-brand text-sm">
          <label className="text-xs text-brand-primary/70">Valor (+ aumenta la deuda, − la reduce)<br /><input type="number" className={`${input} w-40`} value={delta} onChange={(e) => setDelta(Number(e.target.value))} /></label>
          <input className={`${input} w-72`} placeholder={tx("Motivo *")} value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="button" className={btn} disabled={pending} onClick={() => start(async () => done(await adjustAction(documentId, delta, note)))}><T>Confirmar ajuste</T></button>
        </div>
      )}
      {panel === 'writeoff' && (
        <div className="flex flex-wrap items-end gap-2 font-brand text-sm">
          <input className={`${input} w-80`} placeholder={tx("Motivo del castigo (deuda incobrable) *")} value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="button" className={btn} disabled={pending} onClick={() => start(async () => done(await writeOffAction(documentId, note)))}><T>Confirmar castigo</T></button>
        </div>
      )}
      {panel === 'void' && (
        <div className="space-y-2 rounded-xl bg-red-50 p-3 font-brand text-sm">
          <p className="text-red-800">Se cancela el saldo pendiente{modality === 'layaway' ? ' y se libera la reserva' : ''}. ¿Qué hacemos con lo que ya pagó?</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="radio" checked={refund === 'store_credit'} onChange={() => setRefund('store_credit')} /> <T>Dejarlo como saldo a favor</T></label>
            <label className="flex items-center gap-2"><input type="radio" checked={refund === 'refund'} onChange={() => setRefund('refund')} /> <T>Se le devolvió el dinero</T></label>
          </div>
          <div className="flex gap-2">
            <input className={`${input} w-72`} placeholder={tx("Motivo")} value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className={`${btn} border-red-400 text-red-700`} disabled={pending} onClick={() => start(async () => done(await voidAction(documentId, refund, note)))}><T>Confirmar anulación</T></button>
          </div>
        </div>
      )}
      {msg && <p role="status" className={`font-brand text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  )
}
