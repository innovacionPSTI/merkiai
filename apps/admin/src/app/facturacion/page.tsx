import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getAdminUser } from '@/lib/auth'
import { billingView, canManageBilling, getBillingSummary, type BillingTone } from '@/lib/billing'
import PayzenCheckout from './PayzenCheckout'

export const metadata: Metadata = { title: 'Plan y facturación' }
export const dynamic = 'force-dynamic'

const TONE: Record<BillingTone, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  neutral: 'bg-white border-gray-200 text-brand-primary',
}

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
const date = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(iso))

export default async function FacturacionPage({ searchParams }: { searchParams: Promise<{ pago?: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser || !canManageBilling(adminUser.role)) redirect('/no-autorizado')
  const { pago } = await searchParams

  const summary = await getBillingSummary(adminUser.tenantId)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <PageHeader title="Plan y facturación" description="Tu plan de Merkiai, el estado del cobro y tu medio de pago." />
      </div>

      {!summary ? (
        <p className="font-brand text-sm text-brand-primary/60">No pudimos consultar tu facturación en este momento. Intenta de nuevo en unos minutos.</p>
      ) : (() => {
        const view = billingView(summary)
        const sub = summary.subscription
        return (
          <div className="space-y-6">
            {pago === 'procesando' && (
              <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 font-brand text-sm text-sky-800">
                Recibimos tu pago y lo estamos confirmando. En unos segundos verás el estado actualizado (recarga la página) y te llegará un correo.
              </div>
            )}

            <section className={`rounded-2xl border p-6 ${TONE[view.tone]}`}>
              <p className="font-brand text-xs uppercase tracking-wide opacity-70">
                Plan {summary.plan?.name ?? '—'}
                {summary.plan && summary.plan.priceCents > 0 && ` · ${money(summary.plan.priceCents, summary.plan.currency)} / mes`}
              </p>
              <h2 className="font-display text-2xl mt-1">{view.title}</h2>
              <p className="font-brand text-sm mt-2 leading-relaxed">{view.message}</p>
              {sub?.hasPaymentMethod && <p className="font-brand text-xs mt-3 opacity-70">Tarjeta registrada ✓</p>}
            </section>

            {view.cta && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                {summary.billingEnabled ? (
                  <PayzenCheckout cta={view.cta} defaultInterval={sub?.interval ?? 'monthly'} />
                ) : (
                  <p className="font-brand text-sm text-brand-primary/60">El pago en línea aún no está habilitado. Escríbenos para regularizar tu plan.</p>
                )}
              </section>
            )}

            {summary.events.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-display text-lg text-brand-primary mb-3">Historial de cobros</h3>
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
