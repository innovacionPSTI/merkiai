import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listGiftCards } from '@merkiai/database'
import { requireAdminDb } from '@/lib/admin-context'
import { userCanAccess } from '@/lib/roles'
import GiftCardsManager from './GiftCardsManager'

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
  const giftCards = await listGiftCards(db)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift cards y saldo a favor"
        description="Emite gift cards con saldo y gestiona el saldo a favor (store credit) de tus clientes."
      />
      <GiftCardsManager initial={giftCards} />
    </div>
  )
}
