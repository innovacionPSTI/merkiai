/**
 * Contexto de Cartera (E27 · ADR-010) para páginas y acciones del admin.
 * Exige sesión con acceso a Operaciones y la feature `receivables`; expone si
 * la consignación (`consignment`) está habilitada en el plan.
 */
import { redirect, notFound } from 'next/navigation'
import { requireAdminDb } from './admin-context'
import { userCanAccess } from './roles'
import { getTenantEntitlements } from './entitlements'
import { resolveFeature, FEATURES } from '@merkiai/tenancy'
import { formatMoney } from '@merkiai/i18n'

export async function requireCartera() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'productos')) redirect('/no-autorizado')
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId).catch(() => ({ entitlements: null }))
  if (!resolveFeature(entitlements, FEATURES.RECEIVABLES)) notFound()
  return {
    adminUser,
    db,
    tenantId: adminUser.tenantId,
    consignmentEnabled: resolveFeature(entitlements, FEATURES.CONSIGNMENT) && resolveFeature(entitlements, FEATURES.MULTI_LOCATION),
  }
}

export const money = (n: number) =>
  formatMoney(n)

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', open: 'Abierto', partial: 'Abonado', paid: 'Pagado', overdue: 'Vencido', written_off: 'Castigado', void: 'Anulado',
}
export const PAYMENT_STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', open: 'bg-blue-100 text-blue-700', partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', written_off: 'bg-slate-200 text-slate-600', void: 'bg-slate-100 text-slate-400',
}
export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  pending: 'Por entregar', partial: 'Entrega parcial', delivered: 'Entregado', returned: 'Devuelto',
}
export const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', link: 'Enlace de pago', pos: 'Caja (POS)', store_credit: 'Saldo a favor', other: 'Otro',
}
export const MOVEMENT_LABEL: Record<string, string> = {
  charge: 'Cargo', payment: 'Abono', credit_note: 'Nota crédito', adjustment: 'Ajuste', write_off: 'Castigo', credit_applied: 'Saldo a favor aplicado',
}
