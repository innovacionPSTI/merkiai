import type { Metadata } from 'next'
import { getWhatsAppNumber } from '@/lib/whatsapp'
import ConfirmationRecovery from '@/components/checkout/ConfirmationRecovery'
import ConfirmationStatus from '@/components/checkout/ConfirmationStatus'

export const metadata: Metadata = { title: 'Confirmación de pedido' }

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const whatsapp = await getWhatsAppNumber()

  return (
    <div className="bg-brand-cream min-h-screen flex items-center justify-center px-6">
      <ConfirmationRecovery hasOrder={!!order} />
      <ConfirmationStatus order={order ?? null} whatsapp={whatsapp} />
    </div>
  )
}
