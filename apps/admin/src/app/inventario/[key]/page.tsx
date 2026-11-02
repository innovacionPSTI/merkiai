import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getStockItem, listMovements, getAvailable, getItemCost, listUoms } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import { FEATURES as FLAGS } from '@/lib/features'
import { getTenantEntitlements } from '@/lib/entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'

export const metadata: Metadata = { title: 'Kardex' }
export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<string, string> = {
  purchase: 'Compra', production_consume: 'Consumo producción', production_output: 'Salida producción',
  sale: 'Venta', waste: 'Merma', adjustment: 'Ajuste', transfer: 'Traslado', sample: 'Muestra', return: 'Devolución',
}
function fmt(n: number): string { return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(n) }

/** E24 · Kardex de un ítem: historial de movimientos del libro (HU-401). */
export default async function KardexPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements().catch(() => ({ entitlements: null }))
  if (!(FLAGS.inventory || resolveFeature(entitlements, FEATURES.INVENTORY))) notFound()

  const item = await getStockItem(db, key)
  if (!item) notFound()

  const [movs, available, cost, uoms] = await Promise.all([
    listMovements(db, { stockItemId: item.id, limit: 200 }),
    getAvailable(db, item.id),
    getItemCost(db, item.id),
    listUoms(db),
  ])
  const uomCode = new Map(uoms.map((u) => [u.id, u.code]))

  return (
    <div className="space-y-6">
      <PageHeader title={`Kardex · ${item.name}`} description={`Disponible: ${fmt(available)} · Costo unitario: ${cost == null ? '—' : fmt(cost)}`} />
      <a href="/inventario" className="font-brand text-sm text-brand-primary/60 underline">← Volver a Inventario</a>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm font-brand">
          <thead className="bg-slate-50 text-brand-primary/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-right px-4 py-3">Cantidad</th>
              <th className="text-left px-4 py-3">Unidad</th>
              <th className="text-left px-4 py-3">Motivo</th>
              <th className="text-left px-4 py-3">Referencia</th>
            </tr>
          </thead>
          <tbody>
            {movs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-primary/40">Sin movimientos.</td></tr>
            )}
            {movs.map((m) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-brand-primary/70">{new Date(m.created_at).toLocaleString('es-CO')}</td>
                <td className="px-4 py-3">{TYPE_LABEL[m.movement_type] ?? m.movement_type}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${m.direction === 'in' ? 'text-green-700' : 'text-red-600'}`}>
                  {m.direction === 'in' ? '+' : '−'}{fmt(m.qty)}
                </td>
                <td className="px-4 py-3 text-brand-primary/70">{m.uom_id != null ? (uomCode.get(m.uom_id) ?? '') : '—'}</td>
                <td className="px-4 py-3 text-brand-primary/60">{m.reason ?? '—'}</td>
                <td className="px-4 py-3 text-brand-primary/60">{m.ref_type ? `${m.ref_type} ${m.ref_id ?? ''}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
