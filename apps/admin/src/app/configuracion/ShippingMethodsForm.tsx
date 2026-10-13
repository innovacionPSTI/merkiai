'use client'

/**
 * Métodos de envío (HU-280) — lista unificada, un solo método activo.
 *
 * "Tarifa fija" es un método incorporado (sin credenciales) que se lista junto a
 * las transportadoras. La fuente de verdad del método activo es
 * shipping_config.provider ('fixed' | 'skydropx'):
 *   - Activar Tarifa fija  → PATCH { provider: 'fixed' }
 *   - Activar transportadora → activar la instancia + PATCH { provider: 'skydropx' }
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import IntegrationInstancesForm from './IntegrationInstancesForm'
import type { MaskedInstance, PublicProviderDef } from '@/lib/mask-instance'

interface Props {
  provider: 'fixed' | 'skydropx'
  fixedRate: number
  instances: MaskedInstance[]
  providers: PublicProviderDef[]
  storeBaseUrl?: string | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function ShippingMethodsForm({ provider, fixedRate, instances, providers, storeBaseUrl }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [rate, setRate] = useState(String(fixedRate))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function patchShipping(body: Record<string, unknown>) {
    const res = await fetch('/api/admin/shipping', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error((data.error as string) ?? 'No se pudo guardar')
  }

  async function activateFixed() {
    setBusy(true); setErr('')
    try { await patchShipping({ provider: 'fixed' }); router.refresh() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(false) }
  }

  async function saveRate() {
    setBusy(true); setErr('')
    try { await patchShipping({ fixed_rate: Number(rate) }); setEditing(false); router.refresh() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(false) }
  }

  // Al activar una transportadora (id) o desactivar (null), fijamos el método activo.
  async function onAfterActivate(id: string | null) {
    await patchShipping({ provider: id ? 'skydropx' : 'fixed' })
  }

  return (
    <div>
      <IntegrationInstancesForm
        kind="shipping"
        apiBase="/api/admin/shipping-instances"
        addLabel="Agregar transportadora"
        emptyText="Aún no has conectado una transportadora."
        instances={instances}
        providers={providers}
        storeBaseUrl={storeBaseUrl}
        showWebhook
        builtin={{
          title: 'Tarifa fija',
          subtitle: 'Cobro fijo de envío, sin consultar transportadoras.',
          active: provider === 'fixed',
          badgeText: fmt(Number(rate) || 0),
          onActivate: activateFixed,
          onEdit: () => setEditing((v) => !v),
        }}
        onAfterActivate={onAfterActivate}
      />

      {editing && (
        <div className="mt-3 rounded-2xl border border-brand-primary/15 bg-brand-cream/30 p-4">
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Monto de la tarifa fija (COP)</label>
          <div className="flex items-center gap-3">
            <input type="number" min={0} step={500} value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-48 border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
            <button type="button" onClick={saveRate} disabled={busy}
              className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50">
              {busy ? 'Guardando…' : 'Guardar monto'}
            </button>
            <button type="button" onClick={() => { setRate(String(fixedRate)); setEditing(false) }} className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary">Cancelar</button>
          </div>
          <p className="font-brand text-xs text-brand-primary/40 mt-1">Se cobra cuando "Tarifa fija" es el método activo, o como respaldo si la transportadora no responde.</p>
        </div>
      )}

      {err && <p className="mt-3 font-brand text-sm text-red-600">{err}</p>}
    </div>
  )
}
