import Link from 'next/link'
import type { Metadata } from 'next'
import { getWhatsAppNumber } from '@/lib/whatsapp'
import BoldReconcileOnLoad from '@/components/checkout/BoldReconcileOnLoad'
import TuCompraReconcileOnLoad from '@/components/checkout/TuCompraReconcileOnLoad'
import ConfirmationRecovery from '@/components/checkout/ConfirmationRecovery'

export const metadata: Metadata = { title: 'Pedido confirmado' }

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
      {order && <BoldReconcileOnLoad order={order} />}
      {order && <TuCompraReconcileOnLoad order={order} />}
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-display text-brand-primary text-4xl mb-3">
          ¡Pedido confirmado!
        </h1>

        {order && (
          <p className="font-brand text-brand-primary/60 text-lg mb-2">
            Orden <strong className="text-brand-primary">{order}</strong>
          </p>
        )}

        <p className="font-brand text-brand-primary/60 mb-8 leading-relaxed">
          Recibirás un correo electrónico con los detalles de tu pedido y el número de seguimiento
          una vez que sea despachado.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/account/orders"
            className="bg-brand-primary text-brand-cream rounded-full py-3 px-8 font-brand font-medium hover:bg-brand-dark transition-colors"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/shop"
            className="border border-brand-primary text-brand-primary rounded-full py-3 px-8 font-brand font-medium hover:bg-brand-primary hover:text-brand-cream transition-colors"
          >
            Seguir comprando
          </Link>
        </div>

        <p className="font-brand text-xs text-brand-primary/40 mt-8">
          ¿Preguntas? Escríbenos por{' '}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}
