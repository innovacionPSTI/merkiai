import { PageHeader, PanelCard, EmptyState, StatusBadge, Icon, type BadgeTone } from '@merkiai/ui'
import { platformDb } from '@/lib/platform-db'
import { listAccountsOverview, listPlanFeeTerms } from '@/lib/merkiai-pagos'
import { listRecentFeeInvoices, type FeeInvoiceStatus } from '@/lib/fee-collection'
import { formatMoney } from '@/lib/billing-email'
import { PlanFeeForm, AccountForm } from './forms'

export const dynamic = 'force-dynamic'

const STATUS: Record<'pending' | 'active' | 'disabled', { label: string; tone: BadgeTone }> = {
  pending: { label: 'En alta', tone: 'neutral' },
  active: { label: 'Activa', tone: 'success' },
  disabled: { label: 'Desactivada', tone: 'danger' },
}
const INVOICE: Record<FeeInvoiceStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Por cobrar', tone: 'neutral' },
  processing: { label: 'En proceso', tone: 'warn' },
  paid: { label: 'Cobrada', tone: 'success' },
  failed: { label: 'Rechazada', tone: 'danger' },
  waived: { label: 'Sin valor', tone: 'neutral' },
}
const pct = (n: number) => `${n.toLocaleString('es-CO', { maximumFractionDigits: 3 })} %`

export default async function MerkiaiPagosPage() {
  const db = platformDb()
  const [{ data: plans }, { data: tenants }, terms, accounts, invoices] = await Promise.all([
    db.from('plans').select('key, name').eq('active', true).order('price_cents', { ascending: true }),
    db.from('tenants').select('id, name').order('name', { ascending: true }),
    listPlanFeeTerms(db),
    listAccountsOverview(db),
    listRecentFeeInvoices(db).catch(() => []),
  ])
  const tenantList = ((tenants ?? []) as { id: string; name: string | null }[]).map((t) => ({ id: t.id, name: t.name ?? t.id }))
  const withAccount = new Set(accounts.map((a) => a.tenantId))
  const monthFees = accounts.reduce((s, a) => s + a.month.feeCents, 0)

  return (
    <>
      <PageHeader
        title="Merkiai Pagos"
        description="Pasarela PayZen gestionada por Merkiai para las ventas de cada tienda. El dinero va directo a la cuenta bancaria de la tienda; Merkiai cobra una comisión por venta. Recomendado para tiendas de volumen medio/alto (PayZen cobra una mensualidad por tienda); las pequeñas usan su propia pasarela."
      />

      <PanelCard title="Comisión por plan">
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ui-muted)' }}>
          Porcentaje sobre cada venta aprobada más un valor fijo opcional. Puedes dar una tarifa distinta a una tienda en su cuenta.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {((plans ?? []) as { key: string; name: string }[]).map((p) => (
            <PlanFeeForm key={p.key} plan={p.key} planName={p.name} pct={terms[p.key]?.pct ?? 0} fixedPesos={Math.round((terms[p.key]?.fixedCents ?? 0) / 100)} />
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Agregar tienda">
        <AccountForm tenants={tenantList.filter((t) => !withAccount.has(t.id))} />
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888', display: 'flex', gap: 6 }}>
          <Icon name="alert" size={14} />
          Primero crea la tienda en el Back Office PayZen de Merkiai con la cuenta bancaria del comerciante. La contraseña se guarda cifrada (AWS KMS) y nunca se vuelve a mostrar.
        </p>
      </PanelCard>

      <PanelCard title={`Tiendas con Merkiai Pagos (${accounts.length}) · comisiones del mes: ${formatMoney(monthFees, 'COP')}`}>
        {accounts.length === 0 ? (
          <EmptyState icon={<Icon name="tenant" size={28} />} title="Ninguna tienda usa Merkiai Pagos" description="Agrega la primera con el formulario de arriba." />
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {accounts.map((a) => (
              <div key={a.tenantId} style={{ border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <strong style={{ fontSize: 15 }}>{a.tenantName}</strong>
                    <StatusBadge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</StatusBadge>
                    <StatusBadge tone={a.environment === 'production' ? 'success' : 'warn'}>{a.environment === 'production' ? 'Producción' : 'Pruebas'}</StatusBadge>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ui-muted)' }}>
                    Tarifa: {pct(a.terms.pct)}{a.terms.fixedCents ? ` + ${formatMoney(a.terms.fixedCents, 'COP')}` : ''}
                    {a.feePctOverride != null || a.feeFixedCentsOverride != null ? ' (propia)' : ` (plan ${a.plan})`}
                    {' · '}Este mes: {a.month.sales} ventas · {formatMoney(a.month.amountCents, 'COP')} · comisión {formatMoney(a.month.feeCents, 'COP')}
                  </span>
                </div>
                <AccountForm
                  tenants={tenantList}
                  d={{
                    tenantId: a.tenantId, shopId: a.shopId ?? '', status: a.status, hasPassword: a.hasPassword,
                    pctOverride: a.feePctOverride, fixedOverridePesos: a.feeFixedCentsOverride == null ? null : Math.round(a.feeFixedCentsOverride / 100),
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      <PanelCard title="Cobros mensuales de comisiones">
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ui-muted)' }}>
          El día 1 de cada mes se agrupan las comisiones del mes anterior en una cuenta por tienda y se cobran con la tarjeta registrada para su plan (hasta 3 intentos, uno por día). Si la tienda no tiene tarjeta, la cuenta queda por cobrar.
        </p>
        {invoices.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ui-muted)' }}>Aún no hay cobros.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr>{['Tienda', 'Mes', 'Valor', 'Estado', 'Intentos', 'Detalle'].map((h) => <th key={h} style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#666', borderBottom: '1px solid var(--ui-border)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td style={{ padding: 8 }}><strong>{i.tenantName}</strong></td>
                  <td style={{ padding: 8 }}>{i.period}</td>
                  <td style={{ padding: 8 }}>{formatMoney(i.amount_cents, i.currency)}</td>
                  <td style={{ padding: 8 }}><StatusBadge tone={INVOICE[i.status].tone}>{INVOICE[i.status].label}</StatusBadge></td>
                  <td style={{ padding: 8 }}>{i.attempts}</td>
                  <td style={{ padding: 8, color: 'var(--ui-muted)', fontSize: 13 }}>{i.lastError ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PanelCard>
    </>
  )
}
