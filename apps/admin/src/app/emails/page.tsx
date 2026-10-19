import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listEmailLog } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanManageData } from '@/lib/roles'

export const metadata: Metadata = { title: 'Correos' }
export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<string, string> = {
  'order.status': 'Estado de pedido',
  'order.payment': 'Pago',
  'back_in_stock': 'Vuelve a stock',
  'vip.invite': 'Invitación VIP',
}
const STATUS_COLOR: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  suppressed: 'bg-gray-100 text-gray-500',
}
const fmt = (s: string) => new Date(s).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/**
 * HU-162 · Registro de correos transaccionales (email_log). Gated por el permiso
 * de datos (admin/super_admin). RLS por tenant.
 */
export default async function EmailsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanManageData(adminUser)) redirect('/no-autorizado')

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const limit = 50
  const type = sp.type || undefined
  const { entries, total } = await listEmailLog(db, { limit, offset: (page - 1) * limit, type })
  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <PageHeader title="Correos" description="Registro de correos transaccionales enviados y sus fallos (trazabilidad y soporte)." />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left font-brand text-xs text-brand-primary/50">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Destinatario</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center font-brand text-brand-primary/40">Sin correos registrados.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-brand text-brand-primary/60 whitespace-nowrap">{fmt(e.created_at)}</td>
                <td className="px-4 py-3 font-brand text-brand-primary">{TYPE_LABEL[e.type] ?? e.type}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/70">{e.to_email}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/60">{e.entity ?? '—'}</td>
                <td className="px-4 py-3"><span className={`font-brand text-xs rounded-full px-2 py-1 ${STATUS_COLOR[e.status] ?? 'bg-gray-100 text-gray-500'}`}>{e.status}</span></td>
                <td className="px-4 py-3 font-brand text-xs text-red-600">{e.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 font-brand text-sm">
          {page > 1 && <a href={`/emails?page=${page - 1}${type ? `&type=${type}` : ''}`} className="text-brand-primary hover:underline">← Anterior</a>}
          <span className="text-brand-primary/50">Página {page} de {pages}</span>
          {page < pages && <a href={`/emails?page=${page + 1}${type ? `&type=${type}` : ''}`} className="text-brand-primary hover:underline">Siguiente →</a>}
        </div>
      )}
    </div>
  )
}
