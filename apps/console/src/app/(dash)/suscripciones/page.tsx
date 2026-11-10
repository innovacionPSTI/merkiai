import { PageHeader, PanelCard, EmptyState, StatusBadge, Icon, type BadgeTone } from '@merkiai/ui'
import type { SubscriptionStatus } from '@merkiai/tenancy'
import { listSubscriptionsOverview } from '@/lib/billing-runtime'
import { formatMoney } from '@/lib/billing-email'

export const dynamic = 'force-dynamic'

const STATUS: Record<SubscriptionStatus, { label: string; tone: BadgeTone }> = {
  trialing: { label: 'Pendiente de primer pago', tone: 'neutral' },
  active: { label: 'Al día', tone: 'success' },
  past_due: { label: 'En mora', tone: 'warn' },
  suspended: { label: 'Suspendida', tone: 'danger' },
  canceled: { label: 'Cancelada', tone: 'neutral' },
}

const fmtDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(iso)) : '—'

export default async function SuscripcionesPage() {
  const rows = await listSubscriptionsOverview()
  const count = (s: SubscriptionStatus) => rows.filter((r) => r.status === s).length
  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#666', fontWeight: 600, borderBottom: '1px solid var(--ui-border)' }
  const td: React.CSSProperties = { padding: '10px', fontSize: 14, borderBottom: '1px solid var(--ui-border)' }

  return (
    <>
      <PageHeader
        title="Suscripciones"
        description="Cobro de los planes a cada tenant (PayZen). El estado se actualiza solo con cada pago o rechazo; las tiendas en mora se suspenden automáticamente al vencer la gracia."
      />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['active', 'past_due', 'suspended', 'trialing'] as SubscriptionStatus[]).map((s) => (
          <PanelCard key={s} title={STATUS[s].label}>
            <strong style={{ fontSize: 24 }}>{count(s)}</strong>
          </PanelCard>
        ))}
      </div>
      <PanelCard title={`Tenants con suscripción (${rows.length})`}>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="tenant" size={28} />}
            title="Aún no hay suscripciones"
            description="Se crean cuando el dueño de una tienda inicia el pago de su plan desde su panel."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Tenant</th><th style={th}>Plan</th><th style={th}>Valor</th><th style={th}>Estado</th>
                  <th style={th}>Vence / próximo cobro</th><th style={th}>Cobro automático</th><th style={th}>Fallos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.tenantId}>
                    <td style={td}><strong>{r.tenantName}</strong></td>
                    <td style={td}>{r.plan}</td>
                    <td style={td}>{formatMoney(r.amountCents, r.currency)} / {r.interval === 'yearly' ? 'año' : 'mes'}</td>
                    <td style={td}><StatusBadge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusBadge></td>
                    <td style={td}>{fmtDate(r.currentPeriodEnd)}</td>
                    <td style={td}>{r.autoRenew ? 'Sí' : r.hasPaymentMethod ? 'Tarjeta guardada, sin programar' : 'No'}</td>
                    <td style={td}>{r.failedAttempts || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </>
  )
}
