'use client'

import { useCallback, useEffect, useState } from 'react'

interface SalesReport {
  from: string; to: string; revenue: number; orders: number; avgTicket: number
  byDay: { date: string; revenue: number; orders: number }[]
  topProducts: { product_id: number; name: string; qty: number; revenue: number }[]
}

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function ReportesClient() {
  const [from, setFrom] = useState(isoDaysAgo(29))
  const [to, setTo] = useState(isoDaysAgo(0))
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/reports/sales?from=${from}&to=${to}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo cargar el reporte'); setReport(null); return }
      setReport(data)
    } catch {
      setError('No se pudo cargar el reporte'); setReport(null)
    } finally { setLoading(false) }
  }, [from, to])

  useEffect(() => { load() }, []) // carga inicial (últimos 30 días)

  function exportCsv() {
    window.location.href = `/api/admin/reports/sales?from=${from}&to=${to}&format=csv`
  }

  const Metric = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="font-brand text-xs text-brand-primary/50 mb-1">{label}</p>
      <p className="font-display text-brand-primary text-2xl">{value}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Rango + acciones */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">Desde</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary" />
        </div>
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">Hasta</label>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary" />
        </div>
        <button onClick={load} disabled={loading}
          className="font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-50">
          {loading ? 'Cargando…' : 'Aplicar'}
        </button>
        <button onClick={exportCsv} disabled={!report || report.orders === 0}
          className="font-brand text-sm border border-brand-primary text-brand-primary rounded-full px-5 py-2.5 hover:bg-brand-primary hover:text-brand-cream transition-colors disabled:opacity-40">
          Exportar CSV
        </button>
      </div>

      {error && <p className="font-brand text-sm text-amber-600">{error}</p>}

      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric label="Ingresos" value={COP.format(report.revenue)} />
            <Metric label="Pedidos" value={String(report.orders)} />
            <Metric label="Ticket promedio" value={COP.format(report.avgTicket)} />
            <Metric label="Días con ventas" value={String(report.byDay.length)} />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-display text-brand-primary text-lg mb-3">Top productos del período</h2>
            {report.topProducts.length === 0 ? (
              <p className="font-brand text-sm text-brand-primary/40">Sin ventas en el rango seleccionado.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] font-brand text-sm">
                <thead>
                  <tr className="text-brand-primary/50 text-left border-b border-brand-primary/10">
                    <th className="py-2">Producto</th><th className="py-2 text-right">Unidades</th><th className="py-2 text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.product_id} className="border-b border-brand-primary/5 last:border-0">
                      <td className="py-2 text-brand-primary">{p.name}</td>
                      <td className="py-2 text-right text-brand-primary/70">{p.qty}</td>
                      <td className="py-2 text-right text-brand-primary font-medium">{COP.format(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
