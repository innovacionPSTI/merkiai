import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listAudit } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanManageData } from '@/lib/roles'

export const metadata: Metadata = { title: 'Auditoría' }
export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, string> = {
  'data.export': 'Exportación',
  'data.import': 'Importación',
  'data.backup': 'Respaldo',
  'products.batch': 'Acción masiva',
  'order.status': 'Estado de pedido',
  'order.payment_status': 'Validación de pago',
  'return.create': 'Devolución creada',
  'return.resolve': 'Devolución resuelta',
  'return.credit': 'Reembolso como saldo',
  'giftcard.issue': 'Gift card emitida',
  'storecredit.adjust': 'Ajuste de saldo',
}

const fmt = (s: string) =>
  new Date(s).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/**
 * HU-146 · Registro de auditoría. Traza de operaciones sensibles del panel.
 * Gated por el permiso de datos (admin/super_admin). RLS por tenant.
 */
export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanManageData(adminUser)) redirect('/no-autorizado')

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const limit = 50
  const action = sp.action || undefined
  const { entries, total } = await listAudit(db, { limit, offset: (page - 1) * limit, action })
  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoría" description="Registro de operaciones sensibles del panel (quién hizo qué y cuándo)." />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left font-brand text-xs text-brand-primary/50">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Entidad</th>
              <th className="px-4 py-3">Detalle</th>
              <th className="px-4 py-3">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center font-brand text-brand-primary/40">Sin eventos registrados.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-brand text-brand-primary/60 whitespace-nowrap">{fmt(e.created_at)}</td>
                <td className="px-4 py-3 font-brand text-brand-primary">{ACTION_LABEL[e.action] ?? e.action}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/60">{e.entity ?? '—'}{e.entity_id ? ` · ${e.entity_id}` : ''}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/70">{e.summary ?? '—'}</td>
                <td className="px-4 py-3 font-brand text-brand-primary/60 whitespace-nowrap">{e.actor_email ?? '—'}{e.actor_role ? ` (${e.actor_role})` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 font-brand text-sm">
          {page > 1 && <a href={`/auditoria?page=${page - 1}${action ? `&action=${action}` : ''}`} className="text-brand-primary hover:underline">← Anterior</a>}
          <span className="text-brand-primary/50">Página {page} de {pages}</span>
          {page < pages && <a href={`/auditoria?page=${page + 1}${action ? `&action=${action}` : ''}`} className="text-brand-primary hover:underline">Siguiente →</a>}
        </div>
      )}
    </div>
  )
}
