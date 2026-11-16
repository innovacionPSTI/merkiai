import { requireAdminDb } from '@/lib/admin-context'
import { getReturnsForOrder } from '@merkiai/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import OrderStatusUpdater from './OrderStatusUpdater'
import OrderNotes from './OrderNotes'
import ReconcileBoldButton from './ReconcileBoldButton'
import PaymentStatusValidator from './PaymentStatusValidator'
import ReturnsManager from './ReturnsManager'
import { formatMoney, formatAddress, formatPhone } from '@merkiai/i18n'
import { T } from '@merkiai/ui'

export const metadata: Metadata = { title: 'Detalle de pedido' }

const TIMELINE_STEPS = [
  { status: 'pending', label: 'Pedido recibido' },
  { status: 'processing', label: 'Preparando' },
  { status: 'shipped', label: 'Enviado' },
  { status: 'delivered', label: 'Entregado' },
]
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered']

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { db: supabase } = await requireAdminDb()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (!order) notFound()

  // HU-107a · devoluciones del pedido (historial + gestión).
  const returns = await getReturnsForOrder(supabase, order.id).catch(() => [])

  // HU-467 · montos en la moneda del pedido.
  const fmt = (n: number) =>
    formatMoney(n, { currency: (order as { currency?: string | null } | null)?.currency || 'COP' })

  const currentStep = STATUS_ORDER.indexOf(order.status)

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/pedidos" className="text-brand-primary/50 hover:text-brand-primary transition-colors font-brand text-sm">
          <T>← Pedidos</T>
        </Link>
        <h1 className="font-display text-brand-primary text-3xl">{order.order_number}</h1>
        <span className="font-brand text-xs font-semibold bg-brand-cream rounded-full px-3 py-1 text-brand-primary">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles */}
        <div className="lg:col-span-2 space-y-5">
          {/* Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-brand font-semibold text-brand-primary mb-4"><T>Estado del pedido</T></h2>
            <div className="flex items-center gap-2">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= currentStep
                const isLast = i === TIMELINE_STEPS.length - 1
                return (
                  <div key={step.status} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${done ? 'bg-brand-primary text-brand-cream' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <p className={`font-brand text-xs mt-1 text-center ${done ? 'text-brand-primary font-semibold' : 'text-brand-primary/40'}`}>
                        {step.label}
                      </p>
                    </div>
                    {!isLast && <div className={`h-px flex-1 ${i < currentStep ? 'bg-brand-primary' : 'bg-gray-200'}`} />}
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-brand font-semibold text-brand-primary mb-4"><T>Productos</T></h2>
            <div className="space-y-3">
              {(order.items as any[]).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-brand text-sm font-semibold text-brand-primary">{item.product_name}</p>
                    <p className="font-brand text-xs text-brand-primary/50">{item.variant_label} × {item.qty}</p>
                  </div>
                  <span className="font-brand font-bold text-brand-primary text-sm">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-sm font-brand">
              <div className="flex justify-between"><span className="text-brand-primary/50"><T>Subtotal</T></span><span>{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-brand-primary/50"><T>Envío</T></span><span>{fmt(order.shipping_cost)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-green-600"><T>Descuento</T></span><span className="text-green-600">-{fmt(order.discount)}</span></div>}
              {Number((order as { tax_amount?: number }).tax_amount ?? 0) > 0 && <div className="flex justify-between"><span className="text-brand-primary/50"><T>Impuestos</T></span><span>{fmt(Number((order as { tax_amount?: number }).tax_amount))}</span></div>}
              <div className="flex justify-between font-bold text-brand-primary"><span><T>Total</T></span><span>{fmt(order.total)}</span></div>
            </div>
          </div>

          {/* Envío Skydropx */}
          {order.tracking_number && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-brand font-semibold text-brand-primary mb-4"><T>Estado de envío</T></h2>
              <div className="space-y-2 font-brand text-sm">
                <div className="flex justify-between"><span className="text-brand-primary/50"><T>Transportadora</T></span><span className="capitalize">{order.carrier_name}</span></div>
                <div className="flex justify-between"><span className="text-brand-primary/50"><T>Tracking</T></span><span className="font-mono">{order.tracking_number}</span></div>
              </div>
              {order.label_url && (
                <a
                  href={order.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 border border-brand-primary text-brand-primary rounded-full px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors"
                >
                  <T>🖨 Descargar guía PDF</T>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          {/* Cliente */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3"><T>Cliente</T></h3>
            <div className="space-y-1.5 font-brand text-sm">
              <p className="font-semibold text-brand-primary">{order.customer_name}</p>
              <p className="text-brand-primary/60">{order.customer_email}</p>
              {order.customer_phone && <p className="text-brand-primary/60">{order.customer_phone}</p>}
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3"><T>Dirección de envío</T></h3>
            <div className="font-brand text-sm text-brand-primary/70 space-y-1">
              {(() => {
                const addr = order.shipping_addr as any
                // HU-468 · dirección en el formato de su país (CO = formato histórico).
                return (
                  <>
                    {formatAddress(addr, { includeCountry: !!addr.country && addr.country !== 'CO' }).map((line, i) => <p key={i}>{line}</p>)}
                    {addr.phone_e164 && <p>{formatPhone(addr.phone_e164, { international: addr.country !== 'CO' })}</p>}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Pago */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3"><T>Pago</T></h3>
            <div className="font-brand text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-brand-primary/50"><T>Método</T></span>
                <span className="text-brand-primary capitalize">{order.payment_method ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary/50"><T>Estado</T></span>
                <span className={`font-semibold ${order.payment_status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
            {order.payment_method === 'bold' && order.payment_status !== 'approved' && (
              <ReconcileBoldButton orderId={order.id} />
            )}
            {order.payment_method === 'tucompra' && order.payment_status !== 'approved' && (
              <ReconcileBoldButton orderId={order.id} provider="tucompra" />
            )}
            {order.payment_status !== 'approved' && (
              <PaymentStatusValidator orderId={order.id} />
            )}
          </div>

          {/* Notas internas */}
          <OrderNotes orderId={order.id} initialNotes={(order as any).internal_notes ?? null} />

          {/* HU-107a · devoluciones */}
          <ReturnsManager
            orderId={order.id}
            orderNumber={order.order_number}
            canStart={order.payment_status === 'approved' || order.status === 'delivered'}
            initialReturns={returns}
          />
        </div>
      </div>
    </div>
  )
}
