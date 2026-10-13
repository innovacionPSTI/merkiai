'use client'

import { useState, useTransition } from 'react'
import type { ShippingConfig } from '@merkiai/database'
import { SearchableSelect, DEPARTMENTS, getCitiesForDepartment } from '@merkiai/ui'

interface Props {
  initialConfig: ShippingConfig | null
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-primary' : 'bg-brand-primary/20'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

/**
 * Ajustes GLOBALES de envío (HU-280): envío gratis, cargo adicional (fijo + %)
 * y dirección de origen. El método activo (tarifa fija / transportadora) y la
 * tarifa fija se gestionan arriba, en "Métodos de envío".
 */
export default function ShippingConfigForm({ initialConfig }: Props) {
  // ── Envío gratis ──────────────────────────────────────────────────────────
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(initialConfig?.free_shipping_enabled ?? true)
  const [freeShippingMin, setFreeShippingMin] = useState(String(initialConfig?.free_shipping_min_amount ?? 100000))

  // ── Cargo adicional de envío (sobre tarifas de transportadora) ────────────
  const [feeFixed, setFeeFixed]     = useState(String(initialConfig?.handling_fee_fixed ?? 0))
  const [feePercent, setFeePercent] = useState(String(initialConfig?.handling_fee_percent ?? 0))

  // ── Dirección de origen ───────────────────────────────────────────────────
  const [originName,         setOriginName]         = useState(initialConfig?.origin_name ?? '')
  const [originStreet,       setOriginStreet]       = useState(initialConfig?.origin_street ?? '')
  const [originNeighborhood, setOriginNeighborhood] = useState(initialConfig?.origin_neighborhood ?? '')
  const [originCity,         setOriginCity]         = useState(initialConfig?.origin_city ?? '')
  const [originDepartment,   setOriginDepartment]   = useState(initialConfig?.origin_department ?? '')
  const [originPostalCode,   setOriginPostalCode]   = useState(initialConfig?.origin_postal_code ?? '')
  const [originPhone,        setOriginPhone]        = useState(initialConfig?.origin_phone ?? '')
  const [originEmail,        setOriginEmail]        = useState(initialConfig?.origin_email ?? '')

  const [status, setStatus]     = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [, startTransition]     = useTransition()

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  async function handleSave() {
    setStatus('saving'); setErrorMsg('')
    const body: Record<string, unknown> = {
      free_shipping_enabled: freeShippingEnabled,
      free_shipping_min_amount: Number(freeShippingMin),
      handling_fee_fixed: Math.max(0, Math.round(Number(feeFixed) || 0)),
      handling_fee_percent: Math.max(0, Number(feePercent) || 0),
      origin_name:         originName         || null,
      origin_street:       originStreet       || null,
      origin_neighborhood: originNeighborhood || null,
      origin_city:         originCity         || null,
      origin_department:   originDepartment   || null,
      origin_postal_code:  originPostalCode   || null,
      origin_phone:        originPhone        || null,
      origin_email:        originEmail        || null,
    }
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Error desconocido'); setStatus('error'); return }
      setStatus('saved')
      startTransition(() => { setTimeout(() => setStatus('idle'), 3000) })
    } catch { setErrorMsg('Error de red al guardar'); setStatus('error') }
  }

  const feeFixedN = Math.max(0, Number(feeFixed) || 0)
  const feePercentN = Math.max(0, Number(feePercent) || 0)
  const exampleBase = 15000
  const exampleTotal = Math.round(exampleBase * (1 + feePercentN / 100) + feeFixedN)

  return (
    <div className="space-y-6">
      {/* ── Envío gratis ─────────────────────────────────────────────────── */}
      <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-brand text-sm font-semibold text-brand-primary">Envío gratis</p>
            <p className="font-brand text-xs text-brand-primary/40 mt-0.5">Cuando el subtotal supera el monto mínimo, el envío es gratis automáticamente.</p>
          </div>
          <Toggle enabled={freeShippingEnabled} onChange={setFreeShippingEnabled} />
        </div>
        {freeShippingEnabled && (
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Monto mínimo (COP)</label>
            <input type="number" min={0} step={1000} value={freeShippingMin} onChange={(e) => setFreeShippingMin(e.target.value)}
              className="w-48 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
            <p className="font-brand text-xs text-brand-primary/40 mt-1">Pedidos de {fmt(Number(freeShippingMin) || 0)} o más tendrán envío gratis.</p>
          </div>
        )}
      </div>

      {/* ── Cargo adicional de envío ─────────────────────────────────────── */}
      <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4">
        <div>
          <p className="font-brand text-sm font-semibold text-brand-primary">Cargo adicional de envío</p>
          <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
            Se suma a la tarifa que calcula la transportadora (manejo, empaque…). Es transparente para el comprador: se incluye en el precio de envío mostrado, sin desglose. No aplica a la tarifa fija.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Monto fijo (COP)</label>
            <input type="number" min={0} step={500} value={feeFixed} onChange={(e) => setFeeFixed(e.target.value)}
              className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Porcentaje (%)</label>
            <input type="number" min={0} max={100} step={0.5} value={feePercent} onChange={(e) => setFeePercent(e.target.value)}
              className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        {(feeFixedN > 0 || feePercentN > 0) && (
          <p className="font-brand text-xs text-brand-primary/50">
            Ejemplo: una tarifa de {fmt(exampleBase)} se mostraría como <strong>{fmt(exampleTotal)}</strong>.
          </p>
        )}
      </div>

      {/* ── Dirección de origen ──────────────────────────────────────────── */}
      <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4 bg-brand-cream/30">
        <div>
          <p className="font-brand text-sm font-semibold text-brand-primary">Dirección de origen (bodega / remitente)</p>
          <p className="font-brand text-xs text-brand-primary/40 mt-0.5">Aparece en las guías como remitente y se usa para cotizar con transportadoras. Requerida al activar una transportadora.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre / Empresa *</label>
            <input type="text" value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Nombre del remitente / empresa"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Teléfono *</label>
            <input type="tel" value={originPhone} onChange={(e) => setOriginPhone(e.target.value)} placeholder="3001234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Dirección (calle y número) *</label>
          <input type="text" value={originStreet} onChange={(e) => setOriginStreet(e.target.value)} placeholder="Calle 10 # 43-57"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Barrio</label>
            <input type="text" value={originNeighborhood} onChange={(e) => setOriginNeighborhood(e.target.value)} placeholder="Barrio / sector"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
          <SearchableSelect label="Ciudad *" value={originCity} options={getCitiesForDepartment(originDepartment)}
            placeholder={originDepartment ? 'Selecciona ciudad' : 'Primero elige departamento'} disabled={!originDepartment} onChange={setOriginCity} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableSelect label="Departamento *" value={originDepartment} options={DEPARTMENTS}
            placeholder="Selecciona departamento" onChange={(dept) => { setOriginDepartment(dept); setOriginCity('') }} />
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Código postal <span className="font-normal text-brand-primary/40">(opcional)</span></label>
            <input type="text" value={originPostalCode} onChange={(e) => setOriginPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 dígitos" maxLength={6} inputMode="numeric"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Email de contacto *</label>
          <input type="email" value={originEmail} onChange={(e) => setOriginEmail(e.target.value)} placeholder="despachos@mitienda.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2">
        <button onClick={handleSave} disabled={status === 'saving'}
          className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {status === 'saving' ? 'Guardando...' : 'Guardar ajustes'}
        </button>
        {status === 'saved' && <span className="font-brand text-sm text-green-600">Guardado ✓</span>}
        {status === 'error' && <span className="font-brand text-sm text-red-600">{errorMsg}</span>}
      </div>
    </div>
  )
}
