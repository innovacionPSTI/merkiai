import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getReceivablesSettings, listInvoiceEvents } from '@merkiai/database'
import { requireCartera, money } from '@/lib/cartera'
import SettingsForm from './SettingsForm'
import { T } from '@merkiai/ui'
import { getAdminTx } from '@/lib/ui-locale'

export const metadata: Metadata = { title: 'Ajustes · Cartera' }
export const dynamic = 'force-dynamic'

export default async function AjustesCarteraPage() {
  const tx = await getAdminTx()
  const { db, tenantId, consignmentEnabled } = await requireCartera()
  const [settings, events] = await Promise.all([getReceivablesSettings(db, tenantId), listInvoiceEvents(db, { limit: 30 }).catch(() => [])])
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={tx("Ajustes de cartera")} description="Reglas de tu tienda para encargos, apartados, recordatorios y el momento en que se avisa a tu sistema de facturación." />
      <SettingsForm settings={settings} consignmentEnabled={consignmentEnabled} />
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-1"><T>Eventos de facturación recientes</T></h2>
        <p className="font-brand text-xs text-brand-primary/60 mb-3"><T>La plataforma no factura: registra aquí cada evento para tu proveedor de facturación electrónica (integración) o para tu contador.</T></p>
        {events.length === 0 ? <p className="font-brand text-sm text-brand-primary/60"><T>Aún no hay eventos.</T></p> : (
          <table className="w-full font-brand text-sm">
            <thead className="text-left text-xs text-brand-primary/50"><tr><th className="py-1"><T>Fecha</T></th><th className="py-1"><T>Documento</T></th><th className="py-1"><T>Evento</T></th><th className="py-1 text-right"><T>Valor</T></th><th className="py-1"><T>Estado</T></th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-gray-50">
                  <td className="py-1.5">{e.created_at.slice(0, 10)}</td>
                  <td className="py-1.5">{e.receivable_documents?.number ?? e.document_id}</td>
                  <td className="py-1.5">{({ on_document: 'Al crear', on_payment: 'Abono', on_delivery: 'Entrega', on_settlement: 'Saldado' } as Record<string, string>)[e.event] ?? e.event}</td>
                  <td className="py-1.5 text-right">{money(e.amount)}</td>
                  <td className="py-1.5">{({ pending: 'Pendiente', sent: 'Enviado', failed: 'Falló', ignored: 'Ignorado' } as Record<string, string>)[e.status] ?? e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
