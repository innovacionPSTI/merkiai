import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getReceivableDetail, listLocations, getReceivablesSettings, MODALITY_LABEL, consignmentSummary } from '@merkiai/database'
import { requireCartera, money, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE, DELIVERY_STATUS_LABEL, METHOD_LABEL, MOVEMENT_LABEL } from '@/lib/cartera'
import PaymentForm from '../PaymentForm'
import DocumentActions from './DocumentActions'

export const metadata: Metadata = { title: 'Documento · Cartera' }
export const dynamic = 'force-dynamic'

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, tenantId } = await requireCartera()
  const { id } = await params
  const detail = await getReceivableDetail(db, Number(id)).catch(() => null)
  if (!detail) notFound()
  const { doc, lines, party, balance, movements, installments } = detail
  const [locations, settings] = await Promise.all([listLocations(db, { activeOnly: true }).catch(() => []), getReceivablesSettings(db, tenantId)])
  const closed = doc.payment_status === 'void' || doc.payment_status === 'written_off'
  const policy = doc.delivery_policy ?? settings.delivery_policy
  const consign = doc.modality === 'consignment' ? consignmentSummary(lines) : null

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/cartera" className="font-brand text-xs text-brand-primary/60 hover:underline">← Cartera</Link>
          <h1 className="font-display text-2xl text-brand-primary">{doc.number} · {MODALITY_LABEL[doc.modality]}</h1>
          <p className="font-brand text-sm text-brand-primary/70">
            {party ? <Link href={`/cartera/contrapartes/${party.id}`} className="underline">{party.name ?? party.email}</Link> : '—'} · creado {doc.created_at.slice(0, 10)}
            {doc.due_date && ` · vence ${doc.due_date}`}
            {doc.reservation_expires_at && ` · apartado hasta ${doc.reservation_expires_at.slice(0, 10)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`rounded-full px-3 py-1 font-brand text-xs ${PAYMENT_STATUS_STYLE[doc.payment_status]}`}>{PAYMENT_STATUS_LABEL[doc.payment_status]}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-brand text-xs text-slate-700">{DELIVERY_STATUS_LABEL[doc.delivery_status]}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="font-brand text-xs text-brand-primary/60">Total cargado</p><p className="font-display text-xl text-brand-primary">{money(balance.charged)}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="font-brand text-xs text-brand-primary/60">Abonado y descontado</p><p className="font-display text-xl text-brand-primary">{money(balance.credited)}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="font-brand text-xs text-brand-primary/60">Saldo</p><p className={`font-display text-xl ${balance.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>{money(balance.balance)}</p></div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Detalle</h2>
        <table className="w-full font-brand text-sm">
          <thead className="text-left text-xs text-brand-primary/50"><tr>
            <th className="py-1">Descripción</th><th className="py-1 text-right">Cant.</th><th className="py-1 text-right">Precio</th><th className="py-1 text-right">Total</th>
            {consign ? <><th className="py-1 text-right">Vendido</th><th className="py-1 text-right">Devuelto</th><th className="py-1 text-right">En poder del aliado</th></> : <th className="py-1 text-right">Entregado</th>}
          </tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id} className="border-t border-gray-50">
                <td className="py-1.5 text-brand-primary">{l.description}</td>
                <td className="py-1.5 text-right">{l.qty}</td>
                <td className="py-1.5 text-right">{money(l.unit_price)}</td>
                <td className="py-1.5 text-right">{money(l.total)}</td>
                {consign ? <><td className="py-1.5 text-right">{l.qty_sold}</td><td className="py-1.5 text-right">{l.qty_returned}</td><td className="py-1.5 text-right font-semibold">{consign[i].onHand}</td></>
                  : <td className="py-1.5 text-right">{l.qty_delivered} / {l.qty}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {!closed && (
          <DocumentActions
            documentId={doc.id}
            modality={doc.modality}
            balance={balance.balance}
            policy={policy}
            lines={lines.map((l) => ({ id: l.id, description: l.description, pendingDelivery: l.qty - l.qty_delivered, consignAvailable: Math.max(0, l.qty - l.qty_sold - l.qty_returned), isItem: l.kind === 'item' && !!l.stock_item_id }))}
            locations={locations.filter((l) => l.kind !== 'consignment').map((l) => ({ id: l.id, name: l.name }))}
          />
        )}
      </section>

      {installments.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Cuotas</h2>
          <table className="w-full font-brand text-sm">
            <thead className="text-left text-xs text-brand-primary/50"><tr><th className="py-1">#</th><th className="py-1">Vence</th><th className="py-1 text-right">Valor</th><th className="py-1 text-right">Pagado</th><th className="py-1 text-right">Pendiente</th><th className="py-1">Estado</th></tr></thead>
            <tbody>
              {installments.map((i) => (
                <tr key={i.seq} className="border-t border-gray-50">
                  <td className="py-1.5">{i.seq}</td><td className="py-1.5">{i.due_date}</td>
                  <td className="py-1.5 text-right">{money(i.amount)}</td><td className="py-1.5 text-right">{money(i.paid)}</td><td className="py-1.5 text-right">{money(i.pending)}</td>
                  <td className="py-1.5">{i.pending === 0 ? <span className="text-green-700">Pagada</span> : i.overdue ? <span className="text-red-600">Vencida</span> : 'Pendiente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!closed && party && balance.balance > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Registrar abono</h2>
          <PaymentForm partyId={party.id} documentId={doc.id} lines={lines.map((l) => ({ id: l.id, description: l.description }))} suggested={installments.find((i) => i.pending > 0)?.pending} />
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Movimientos</h2>
        {movements.length === 0 ? <p className="font-brand text-sm text-brand-primary/60">Sin movimientos.</p> : (
          <table className="w-full font-brand text-sm">
            <thead className="text-left text-xs text-brand-primary/50"><tr><th className="py-1">Fecha</th><th className="py-1">Tipo</th><th className="py-1">Medio / detalle</th><th className="py-1 text-right">Valor</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-gray-50">
                  <td className="py-1.5">{m.created_at.slice(0, 10)}</td>
                  <td className="py-1.5">{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                  <td className="py-1.5 text-brand-primary/70">{[m.method ? METHOD_LABEL[m.method] ?? m.method : null, m.reference, m.note].filter(Boolean).join(' · ') || '—'}</td>
                  <td className={`py-1.5 text-right ${m.delta > 0 ? 'text-brand-primary' : 'text-green-700'}`}>{m.delta > 0 ? '' : '−'}{money(Math.abs(m.delta))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {doc.notes && <p className="mt-3 font-brand text-xs text-brand-primary/60">Notas: {doc.notes}</p>}
      </section>
    </div>
  )
}
