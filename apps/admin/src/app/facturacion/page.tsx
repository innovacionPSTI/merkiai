import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getAdminUser } from '@/lib/auth'
import { billingView, canManageBilling, getBillingSummary, FEE_STATUS_LABEL, type BillingTone } from '@/lib/billing'
import PayzenCheckout from './PayzenCheckout'
import { formatMoney, formatDate } from '@merkiai/i18n'
import { T } from '@merkiai/ui'
import { getAdminTx } from '@/lib/ui-locale'

export const metadata: Metadata = { title: 'Plan y facturación' }
export const dynamic = 'force-dynamic'

const TONE: Record<BillingTone, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  neutral: 'bg-white border-gray-200 text-brand-primary',
}

const money = (cents: number, currency: string) =>
  formatMoney(cents / 100, { currency })
const date = (iso: string) =>
  formatDate(iso, { dateStyle: 'medium', timeZone: 'America/Bogota' })

export default async function FacturacionPage({ searchParams }: { searchParams: Promise<{ pago?: string }> }) {
  const tx = await getAdminTx()
  const adminUser = await getAdminUser()
  if (!adminUser || !canManageBilling(adminUser.role)) redirect('/no-autorizado')
  const { pago } = await searchParams

  const summary = await getBillingSummary(adminUser.tenantId)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <PageHeader title={tx("Plan y facturación")} description="Tu plan de Merkiai, el estado del cobro y tu medio de pago." />
      </div>

      {!summary ? (
        <p className="font-brand text-sm text-brand-primary/60"><T>No pudimos consultar tu facturación en este momento. Intenta de nuevo en unos minutos.</T></p>
      ) : (() => {
        const view = billingView(summary)
        const sub = summary.subscription
        return (
          <div className="space-y-6">
            {pago === 'procesando' && (
              <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 font-brand text-sm text-sky-800">
                <T>Recibimos tu pago y lo estamos confirmando. En unos segundos verás el estado actualizado (recarga la página) y te llegará un correo.</T>
              </div>
            )}

            <section className={`rounded-2xl border p-6 ${TONE[view.tone]}`}>
              <p className="font-brand text-xs uppercase tracking-wide opacity-70">
                Plan {summary.plan?.name ?? '—'}
                {summary.plan && summary.plan.priceCents > 0 && ` · ${money(summary.plan.priceCents, summary.plan.currency)} / mes`}
              </p>
              <h2 className="font-display text-2xl mt-1">{view.title}</h2>
              <p className="font-brand text-sm mt-2 leading-relaxed">{view.message}</p>
              {sub?.hasPaymentMethod && <p className="font-brand text-xs mt-3 opacity-70"><T>Tarjeta registrada ✓</T></p>}
            </section>

            {view.cta && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                {summary.billingEnabled ? (
                  <PayzenCheckout cta={view.cta} defaultInterval={sub?.interval ?? 'monthly'} />
                ) : (
                  <p className="font-brand text-sm text-brand-primary/60"><T>El pago en línea aún no está habilitado. Escríbenos para regularizar tu plan.</T></p>
                )}
              </section>
            )}

            {(summary.feeInvoices?.length ?? 0) > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-display text-lg text-brand-primary mb-1"><T>Comisiones de Merkiai Pagos</T></h3>
                <p className="font-brand text-xs text-brand-primary/50 mb-3"><T>Se cobran el mes siguiente con la tarjeta de tu plan.</T></p>
                <ul className="divide-y divide-gray-100">
                  {summary.feeInvoices!.map((f) => (
                    <li key={f.period} className="flex justify-between py-2 font-brand text-sm text-brand-primary">
                      <span>{f.period}</span>
                      <span className="text-brand-primary/60">{money(f.amountCents, f.currency)} · {FEE_STATUS_LABEL[f.status] ?? f.status}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.events.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-display text-lg text-brand-primary mb-3"><T>Historial de cobros</T></h3>
                <ul className="divide-y divide-gray-100">
                  {summary.events.map((e, i) => (
                    <li key={i} className="flex justify-between py-2 font-brand text-sm text-brand-primary">
                      <span>{e.label}</span>
                      <span className="text-brand-primary/60">
                        {e.amountCents != null && e.currency ? `${money(e.amountCents, e.currency)} · ` : ''}{date(e.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      })()}
    </div>
  )
}
