import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStatement, MODALITY_LABEL } from '@merkiai/database'
import { requireCartera, money, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE, METHOD_LABEL, MOVEMENT_LABEL } from '@/lib/cartera'
import PaymentForm from '../../PaymentForm'
import PrintButton from './PrintButton'

export const metadata: Metadata = { title: 'Estado de cuenta · Cartera' }
export const dynamic = 'force-dynamic'

/** Estado de cuenta de la contraparte: documentos, movimientos con saldo acumulado y abono a la cuenta corriente. */
export default async function EstadoDeCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { db } = await requireCartera()
  const { id } = await params
  const st = await getStatement(db, id).catch(() => null)
  if (!st?.party) notFound()
  const { party, documents, movements, balance } = st

  return (
    <div className="space-y-5 max-w-5xl print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/cartera/contrapartes" className="font-brand text-xs text-brand-primary/60 hover:underline print:hidden">← Clientes y aliados</Link>
          <h1 className="font-display text-2xl text-brand-primary">Estado de cuenta · {party.name ?? party.email}</h1>
          <p className="font-brand text-sm text-brand-primary/70">
            {[party.document_id, party.email, party.phone].filter(Boolean).join(' · ')} · al {new Date().toISOString().slice(0, 10)}
            {party.credit_limit != null && ` · cupo ${money(party.credit_limit)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-brand text-xs text-brand-primary/60">Saldo</p>
          <p className={`font-display text-2xl ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>{money(balance)}</p>
          <PrintButton partyId={party.id} hasEmail={!!party.email} />
        </div>
      </div>

      {balance > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 print:hidden">
          <h2 className="font-brand text-sm font-semibold text-brand-primary mb-1">Abono a la cuenta</h2>
          <p className="font-brand text-xs text-brand-primary/60 mb-3">Se aplica a los documentos más antiguos primero. Si sobra, queda como saldo a favor (crédito en tienda).</p>
          <PaymentForm partyId={party.id} />
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Documentos</h2>
        {documents.length === 0 ? <p className="font-brand text-sm text-brand-primary/60">Sin documentos.</p> : (
          <table className="w-full font-brand text-sm">
            <thead className="text-left text-xs text-brand-primary/50"><tr><th className="py-1">Número</th><th className="py-1">Tipo</th><th className="py-1">Estado</th><th className="py-1">Vence</th><th className="py-1 text-right">Total</th><th className="py-1 text-right">Saldo</th></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t border-gray-50">
                  <td className="py-1.5"><Link href={`/cartera/${d.id}`} className="text-brand-primary hover:underline">{d.number}</Link></td>
                  <td className="py-1.5">{MODALITY_LABEL[d.modality]}</td>
                  <td className="py-1.5"><span className={`rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_STYLE[d.payment_status]}`}>{PAYMENT_STATUS_LABEL[d.payment_status]}</span></td>
                  <td className="py-1.5">{d.due_date ?? '—'}</td>
                  <td className="py-1.5 text-right">{money(d.total)}</td>
                  <td className="py-1.5 text-right font-semibold">{money(d.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">Movimientos</h2>
        {movements.length === 0 ? <p className="font-brand text-sm text-brand-primary/60">Sin movimientos.</p> : (
          <table className="w-full font-brand text-sm">
            <thead className="text-left text-xs text-brand-primary/50"><tr><th className="py-1">Fecha</th><th className="py-1">Tipo</th><th className="py-1">Detalle</th><th className="py-1 text-right">Cargo</th><th className="py-1 text-right">Abono</th><th className="py-1 text-right">Saldo</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-gray-50">
                  <td className="py-1.5">{m.created_at.slice(0, 10)}</td>
                  <td className="py-1.5">{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                  <td className="py-1.5 text-brand-primary/70">{[m.method ? METHOD_LABEL[m.method] ?? m.method : null, m.reference, m.note].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="py-1.5 text-right">{m.delta > 0 ? money(m.delta) : ''}</td>
                  <td className="py-1.5 text-right text-green-700">{m.delta < 0 ? money(-m.delta) : ''}</td>
                  <td className="py-1.5 text-right font-semibold">{money(m.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
