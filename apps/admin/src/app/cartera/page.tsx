import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getAgingReport, getCollectionsReport, listReceivableDocuments, MODALITY_LABEL, AGING_BUCKETS, AGING_LABEL, isModality, type Modality } from '@merkiai/database'
import { requireCartera, money, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE, DELIVERY_STATUS_LABEL } from '@/lib/cartera'
import { T } from '@merkiai/ui'
import { getAdminTx } from '@/lib/ui-locale'

export const metadata: Metadata = { title: 'Cartera' }
export const dynamic = 'force-dynamic'

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'open_all', label: 'Por cobrar' }, { key: 'overdue', label: 'Vencidos' }, { key: 'paid', label: 'Pagados' }, { key: 'all', label: 'Todos' },
]

/** E27 · Cartera: saldos, edades, recaudo y documentos (crédito, encargos, apartados, consignación). */
export default async function CarteraPage({ searchParams }: { searchParams: Promise<{ estado?: string; modalidad?: string }> }) {
  const tx = await getAdminTx()
  const { db, consignmentEnabled } = await requireCartera()
  const sp = await searchParams
  const estado = sp.estado ?? 'open_all'
  const modality = isModality(sp.modalidad) ? (sp.modalidad as Modality) : undefined
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const [aging, collections, docs] = await Promise.all([
    getAgingReport(db).catch(() => null),
    getCollectionsReport(db, monthStart, new Date(now.getTime() + 86_400_000).toISOString()).catch(() => null),
    listReceivableDocuments(db, {
      status: estado === 'all' ? undefined : (estado as 'open_all' | 'overdue' | 'paid'),
      modality, limit: 300,
    }).catch(() => []),
  ])
  const overdue = aging ? aging.total - aging.current : 0
  const q = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams({ ...(estado ? { estado } : {}), ...(modality ? { modalidad: modality } : {}) })
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k)
    return `/cartera?${p.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={tx("Cartera")} description="Lo que te deben y lo que te abonan: ventas a crédito, encargos con anticipo, apartados y consignación." />
        <div className="flex flex-wrap gap-2 font-brand text-sm">
          <Link href="/cartera/contrapartes" className="rounded-full border border-gray-200 px-4 py-2 hover:border-brand-primary"><T>Clientes y aliados</T></Link>
          <Link href="/cartera/ajustes" className="rounded-full border border-gray-200 px-4 py-2 hover:border-brand-primary"><T>Ajustes</T></Link>
          <a href="/api/admin/receivables/export" className="rounded-full border border-gray-200 px-4 py-2 hover:border-brand-primary">Exportar (CSV)</a>
          <Link href="/cartera/nuevo" className="rounded-full bg-brand-primary px-4 py-2 text-white hover:bg-brand-dark"><T>Nuevo documento</T></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Por cobrar', value: aging?.total ?? 0 },
          { label: 'Vencido', value: overdue, warn: overdue > 0 },
          { label: 'Recaudado este mes', value: collections?.total ?? 0 },
          { label: 'Anticipos sin entregar', value: collections?.advancesPending ?? 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="font-brand text-xs text-brand-primary/60">{k.label}</p>
            <p className={`font-display text-xl ${k.warn ? 'text-red-600' : 'text-brand-primary'}`}>{money(k.value)}</p>
          </div>
        ))}
      </div>

      {aging && aging.total > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3"><T>Cartera por edades</T></h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {AGING_BUCKETS.map((b) => (
              <div key={b} className={`rounded-xl p-3 ${b === 'current' ? 'bg-slate-50' : b === 'd90_plus' ? 'bg-red-50' : 'bg-amber-50'}`}>
                <p className="font-brand text-xs text-brand-primary/60">{AGING_LABEL[b]}</p>
                <p className="font-brand text-sm font-semibold text-brand-primary">{money(aging[b])}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3 font-brand text-sm">
          {FILTERS.map((f) => (
            <Link key={f.key} href={q({ estado: f.key })} className={`rounded-full px-3 py-1 ${estado === f.key ? 'bg-brand-primary text-white' : 'text-brand-primary/70 hover:bg-gray-50'}`}>{f.label}</Link>
          ))}
          <span className="mx-2 h-4 w-px bg-gray-200" />
          <Link href={q({ modalidad: undefined })} className={`rounded-full px-3 py-1 ${!modality ? 'bg-brand-cream text-brand-primary' : 'text-brand-primary/70 hover:bg-gray-50'}`}><T>Todas</T></Link>
          {(Object.keys(MODALITY_LABEL) as Modality[]).filter((m) => m !== 'consignment' || consignmentEnabled).map((m) => (
            <Link key={m} href={q({ modalidad: m })} className={`rounded-full px-3 py-1 ${modality === m ? 'bg-brand-cream text-brand-primary' : 'text-brand-primary/70 hover:bg-gray-50'}`}>{MODALITY_LABEL[m]}</Link>
          ))}
        </div>
        {docs.length === 0 ? (
          <p className="p-6 font-brand text-sm text-brand-primary/60"><T>No hay documentos con este filtro. Crea uno con “Nuevo documento”.</T></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-brand text-sm">
              <thead className="text-left text-xs text-brand-primary/50">
                <tr><th className="px-4 py-2"><T>Número</T></th><th className="px-4 py-2"><T>Cliente / aliado</T></th><th className="px-4 py-2"><T>Tipo</T></th><th className="px-4 py-2"><T>Pago</T></th><th className="px-4 py-2"><T>Entrega</T></th><th className="px-4 py-2 text-right"><T>Total</T></th><th className="px-4 py-2 text-right"><T>Saldo</T></th><th className="px-4 py-2"><T>Vence</T></th></tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-2"><Link href={`/cartera/${d.id}`} className="font-medium text-brand-primary underline-offset-2 hover:underline">{d.number}</Link></td>
                    <td className="px-4 py-2 text-brand-primary">{d.party_name ?? '—'}</td>
                    <td className="px-4 py-2 text-brand-primary/70">{MODALITY_LABEL[d.modality]}</td>
                    <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_STYLE[d.payment_status]}`}>{PAYMENT_STATUS_LABEL[d.payment_status]}</span></td>
                    <td className="px-4 py-2 text-brand-primary/70">{DELIVERY_STATUS_LABEL[d.delivery_status]}</td>
                    <td className="px-4 py-2 text-right">{money(d.total)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{money(d.balance)}</td>
                    <td className="px-4 py-2 text-brand-primary/70">{d.due_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
