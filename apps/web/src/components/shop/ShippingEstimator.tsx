'use client'

import { useState } from 'react'

/**
 * HU-285 · Estimador de envío en la PDP. Reutiliza el endpoint existente
 * `POST /api/shipping/rates` (mismo motor que el checkout: tarifa fija o
 * transportadora activa + cargo adicional). No agrega lógica de proveedor.
 * Activable por tienda (`store_config.pdp_shipping_estimator`). Tokens de tema.
 */
interface EstimatorItem {
  price: number
  qty: number
  weight_kg?: number | null
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
}

interface Rate { carrier_name: string; service_name: string; total_price: number; days: number }

export default function ShippingEstimator({ item }: { item: EstimatorItem | null }) {
  const [city, setCity] = useState('')
  const [department, setDepartment] = useState('')
  const [postal, setPostal] = useState('')
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Rate[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  async function estimate(e: React.FormEvent) {
    e.preventDefault()
    if (!item || !city.trim() || !department.trim()) return
    setLoading(true); setError(null); setRates(null)
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: { city: city.trim(), department: department.trim(), postal_code: postal.trim() },
          items: [item],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo estimar el envío'); return }
      const list: Rate[] = Array.isArray(data.rates) ? data.rates : []
      if (list.length === 0) { setError('Sin cobertura para este destino'); return }
      // Más barata primero.
      setRates([...list].sort((a, b) => a.total_price - b.total_price).slice(0, 3))
    } catch {
      setError('No se pudo estimar el envío')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-brand-primary/15 p-4 mb-6">
      <p className="font-brand text-sm font-semibold text-brand-primary mb-3">Estimar envío</p>
      <form onSubmit={estimate} className="flex flex-wrap gap-2 items-end">
        <input
          value={city} onChange={(e) => setCity(e.target.value)}
          placeholder="Ciudad" aria-label="Ciudad"
          className="flex-1 min-w-[7rem] border border-brand-primary/20 rounded-full px-4 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
        />
        <input
          value={department} onChange={(e) => setDepartment(e.target.value)}
          placeholder="Departamento" aria-label="Departamento"
          className="flex-1 min-w-[7rem] border border-brand-primary/20 rounded-full px-4 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
        />
        <input
          value={postal} onChange={(e) => setPostal(e.target.value)}
          placeholder="Código postal (opcional)" aria-label="Código postal"
          className="flex-1 min-w-[7rem] border border-brand-primary/20 rounded-full px-4 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
        />
        <button
          type="submit"
          disabled={loading || !city.trim() || !department.trim()}
          className="shrink-0 rounded-full bg-brand-primary text-brand-cream px-5 py-2 font-brand text-sm font-medium hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculando…' : 'Estimar'}
        </button>
      </form>

      {error && <p className="font-brand text-xs text-amber-600 mt-3">{error}</p>}

      {rates && rates.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {rates.map((r, i) => (
            <li key={i} className="flex items-center justify-between font-brand text-sm text-brand-primary">
              <span>{r.carrier_name}{r.service_name ? ` · ${r.service_name}` : ''}{r.days ? ` · ${r.days} día(s)` : ''}</span>
              <span className="font-semibold">{fmt(r.total_price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
