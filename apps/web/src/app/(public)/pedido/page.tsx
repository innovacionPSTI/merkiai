'use client'

/**
 * HU-150 · Consulta de pedido como invitado. El comprador sin cuenta ingresa su
 * número de pedido + correo y ve el estado + tracking si coinciden (verificación
 * server-side en `/api/orders/lookup`). No revela información si no coinciden.
 */
import { useState } from 'react'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', processing: 'En preparación', shipped: 'En camino',
  delivered: 'Entregado', cancelled: 'Cancelado', exception: 'Inconveniente',
}

interface GuestOrder {
  order_number: string; status: string; payment_status: string | null; created_at: string
  tracking_number: string | null; carrier_name: string | null
  items: { product_name: string; variant_label: string; qty: number }[]; total: number
}

export default function GuestOrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<GuestOrder | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setOrder(null)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo consultar el pedido.'); return }
      setOrder(data.order)
    } catch {
      setError('No se pudo consultar el pedido.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-24">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-brand-primary text-section mb-2">Consultar mi pedido</h1>
        <p className="font-brand text-sm text-brand-primary/50 mb-8">
          Ingresa el número de pedido y el correo con el que compraste para ver su estado.
        </p>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Número de pedido</label>
            <input
              value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ej: ORD-0042"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Correo electrónico</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
            />
          </div>
          {error && <p className="font-brand text-sm text-amber-600">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full font-brand text-sm bg-brand-primary text-brand-cream rounded-full py-3 hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Consultando…' : 'Consultar pedido'}
          </button>
        </form>

        {order && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider">Pedido</p>
                <p className="font-display text-brand-primary text-xl">{order.order_number}</p>
              </div>
              <span className="font-brand text-sm font-medium bg-brand-cream text-brand-primary rounded-full px-3 py-1">
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <p className="font-brand text-xs text-brand-primary/50">Fecha: {fmtDate(order.created_at)}</p>
            {order.tracking_number && (
              <p className="font-brand text-sm text-brand-primary mt-2">
                Guía: <strong>{order.tracking_number}</strong>{order.carrier_name ? ` · ${order.carrier_name}` : ''}
              </p>
            )}
            <hr className="border-brand-primary/10 my-4" />
            <ul className="space-y-2">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between font-brand text-sm text-brand-primary/80">
                  <span>{it.qty}× {it.product_name}{it.variant_label ? ` · ${it.variant_label}` : ''}</span>
                </li>
              ))}
            </ul>
            <hr className="border-brand-primary/10 my-4" />
            <div className="flex justify-between font-brand font-bold text-brand-primary">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
