import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listGiftCards, getStoreValueReconciliation } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import GiftCardsManager from './GiftCardsManager'

const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export const metadata: Metadata = { title: 'Gift cards' }
export const dynamic = 'force-dynamic'

/**
 * HU-148 · Gift cards y saldo a favor. Emisión de gift cards con saldo canjeable
 * y ajuste del saldo a favor por cliente. El canje en el checkout es la fase 2.
 * Gated por la sección "cupones".
 */
export default async function GiftCardsPage() {
  const { adminUser, db } = await requireAdminDb()
  if (!userCanAccess(adminUser, 'cupones')) redirect('/no-autorizado')
  const [giftCards, recon] = await Promise.all([listGiftCards(db), getStoreValueReconciliation(db)])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift cards y saldo a favor"
        description="Emite gift cards con saldo y gestiona el saldo a favor (store credit) de tus clientes."
      />

      {/* HU-300 AC-5 · conciliación de valor emitido vs. canjeado */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Gift cards emitidas', money(recon.giftCards.issued), `${recon.giftCards.count} · canjeado ${money(recon.giftCards.redeemed)}`],
          ['Saldo gift cards activo', money(recon.giftCards.remaining), 'pendiente de canjear'],
          ['Saldo a favor vigente', money(recon.storeCredit.balance), `abonado ${money(recon.storeCredit.credited)} · usado ${money(recon.storeCredit.consumed)}`],
        ].map(([k, v, sub]) => (
          <div key={k} className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-brand text-xs text-brand-primary/50">{k}</p>
            <p className="font-display text-brand-primary text-xl mt-1">{v}</p>
            <p className="font-brand text-[11px] text-brand-primary/40 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <GiftCardsManager initial={giftCards} />
    </div>
  )
}
