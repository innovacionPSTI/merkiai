import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { inventorySummary, movementsSummarySince, inventoryAlerts } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'

export const metadata: Metadata = { title: 'Operaciones' }
export const dynamic = 'force-dynamic'

const CLASS_LABEL: Record<string, string> = { materia_prima: 'Materia prima', insumo: 'Insumo', terminado: 'Terminado', servicio: 'Servicio' }
const TYPE_LABEL: Record<string, string> = {
  purchase: 'Compras', production_consume: 'Consumo producción', production_output: 'Salida producción',
  sale: 'Ventas', waste: 'Merma', adjustment: 'Ajustes', transfer: 'Traslados', sample: 'Muestras', return: 'Devoluciones',
}
function money(n: number): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }
function num(n: number): string { return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(n) }

/** E24 · Tablero de operaciones (HU-409 F1): valor del inventario a costo,
 *  existencias por clase y resumen de movimientos de los últimos 30 días, sobre
 *  las proyecciones del ledger. Las alertas (bajo mínimo, merma) llegan después. */
export default async function OperacionesPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!(FLAGS.inventory || resolveFeature(entitlements, FEATURES.INVENTORY))) notFound()

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [inv, mov, alerts] = await Promise.all([inventorySummary(db), movementsSummarySince(db, since), inventoryAlerts(db)])

  return (
    <div className="space-y-6">
      <PageHeader title="Operaciones" description="Tablero sobre el libro de inventario: valor a costo, existencias por clase y movimientos de los últimos 30 días." />

      {/* Alertas (HU-409 F2a) */}
      {alerts.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-display text-brand-primary text-lg mb-3">Alertas de inventario <span className="font-brand text-sm text-brand-primary/40">({alerts.length})</span></h2>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.stock_item_id} className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
                <span className="flex items-center gap-2 font-brand text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <a href={`/inventario/${a.key}`} className="text-brand-primary underline">{a.name}</a>
                  <span className="text-brand-primary/50">{a.kind === 'out_of_stock' ? 'agotado' : 'bajo mínimo'}</span>
                </span>
                <span className="font-brand text-sm tabular-nums text-brand-primary/60">{num(a.available)} / mín {num(a.reorder_point)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Valor del inventario (a costo)" value={money(inv.totalValue)} />
        <Kpi label="Ítems activos" value={String(inv.totalItems)} hint={`${inv.sellableItems} vendibles`} />
        <Kpi label="Movimientos (30 días)" value={String(mov.total)} />
        <Kpi label="Ítems sin costo" value={String(inv.withoutCost)} hint="con disponible, sin costo" />
      </div>

      {/* Existencias por clase */}
      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-display text-brand-primary text-lg mb-3">Existencias por clase</h2>
        <table className="w-full text-sm font-brand">
          <thead className="text-brand-primary/50 text-xs uppercase">
            <tr><th className="text-left py-1">Clase</th><th className="text-right py-1">Ítems</th><th className="text-right py-1">Valor a costo</th></tr>
          </thead>
          <tbody>
            {inv.byClass.length === 0 && <tr><td colSpan={3} className="py-3 text-brand-primary/40">Sin ítems de inventario.</td></tr>}
            {inv.byClass.map((c) => (
              <tr key={c.item_class} className="border-t border-gray-100">
                <td className="py-2 text-brand-primary">{CLASS_LABEL[c.item_class] ?? c.item_class}</td>
                <td className="py-2 text-right tabular-nums text-brand-primary/70">{c.count}</td>
                <td className="py-2 text-right tabular-nums text-brand-primary/70">{money(c.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Movimientos últimos 30 días */}
      <section className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-display text-brand-primary text-lg mb-3">Movimientos · últimos 30 días</h2>
        <table className="w-full text-sm font-brand">
          <thead className="text-brand-primary/50 text-xs uppercase">
            <tr>
              <th className="text-left py-1">Tipo</th>
              <th className="text-right py-1">N.º</th>
              <th className="text-right py-1">Entradas</th>
              <th className="text-right py-1">Salidas</th>
              <th className="text-right py-1">Valor entradas</th>
            </tr>
          </thead>
          <tbody>
            {mov.byType.length === 0 && <tr><td colSpan={5} className="py-3 text-brand-primary/40">Sin movimientos en el período.</td></tr>}
            {mov.byType.map((t) => (
              <tr key={t.movement_type} className="border-t border-gray-100">
                <td className="py-2 text-brand-primary">{TYPE_LABEL[t.movement_type] ?? t.movement_type}</td>
                <td className="py-2 text-right tabular-nums text-brand-primary/70">{t.count}</td>
                <td className="py-2 text-right tabular-nums text-green-700">{t.qtyIn ? num(t.qtyIn) : '—'}</td>
                <td className="py-2 text-right tabular-nums text-red-600">{t.qtyOut ? num(t.qtyOut) : '—'}</td>
                <td className="py-2 text-right tabular-nums text-brand-primary/70">{t.valueIn ? money(t.valueIn) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="font-brand text-xs uppercase tracking-wide text-brand-primary/50">{label}</p>
      <p className="font-display text-brand-primary text-2xl mt-1 tabular-nums">{value}</p>
      {hint && <p className="font-brand text-xs text-brand-primary/40 mt-1">{hint}</p>}
    </div>
  )
}
