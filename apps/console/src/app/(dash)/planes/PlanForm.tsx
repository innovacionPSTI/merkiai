'use client'

import { useState } from 'react'
import { ENTITLEMENTS_CATALOG } from '@merkiai/tenancy'
import { input, btn, mono } from '@/lib/styles'
import type { PlanRow } from '@/lib/plans'
import { savePlan } from '../../actions'

const FEATURES = ENTITLEMENTS_CATALOG.filter((e) => e.kind === 'feature')
const LIMITS = ENTITLEMENTS_CATALOG.filter((e) => e.kind === 'limit')

const EMPTY: PlanRow = {
  key: '', name: '', price_cents: 0, currency: 'COP',
  features: {}, limits: {}, data_isolation: 'shared', active: true,
}

/**
 * Editor de planes catálogo-driven (HU-239 v2): toggles por feature + inputs por
 * límite, tomados de ENTITLEMENTS_CATALOG (fuente única). Elegir un plan del
 * selector precarga sus valores (crear si eliges «Nuevo plan»).
 */
export default function PlanForm({ plans }: { plans: PlanRow[] }) {
  const [selectedKey, setSelectedKey] = useState<string>('')
  const p = plans.find((x) => x.key === selectedKey) ?? EMPTY
  const limitVal = (k: string) => {
    const v = p.limits?.[k]
    return typeof v === 'number' ? String(v) : ''
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <label style={{ display: 'block', marginBottom: 12, fontSize: 13, color: '#888' }}>
        Editar plan existente o crear uno nuevo:
        <select
          style={{ ...input, marginTop: 4 }}
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
        >
          <option value="">➕ Nuevo plan</option>
          {plans.map((pl) => (
            <option key={pl.key} value={pl.key}>{pl.name} ({pl.key})</option>
          ))}
        </select>
      </label>

      {/* Re-montar el form al cambiar de plan para refrescar los defaultValue. */}
      <form key={selectedKey} action={savePlan} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input style={input} name="key" placeholder="key (p.ej. pro)" defaultValue={p.key} required readOnly={!!selectedKey} />
          <input style={input} name="name" placeholder="Nombre visible" defaultValue={p.name} required />
          <input style={input} name="price_cents" type="number" min={0} placeholder="precio en centavos" defaultValue={p.price_cents} />
          <input style={input} name="currency" placeholder="COP" defaultValue={p.currency} />
          <select style={input} name="data_isolation" defaultValue={p.data_isolation}>
            <option value="shared">shared</option>
            <option value="schema">schema</option>
            <option value="dedicated">dedicated</option>
          </select>
          <select style={input} name="active" defaultValue={String(p.active)}>
            <option value="true">activo</option>
            <option value="false">inactivo</option>
          </select>
        </div>

        <fieldset style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 12, color: '#aaa', padding: '0 6px' }}>Funcionalidades</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FEATURES.map((f) => (
              <label key={f.key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }} title={f.description}>
                <input type="checkbox" name={`feature_${f.key}`} defaultChecked={p.features?.[f.key] === true} />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 12, color: '#aaa', padding: '0 6px' }}>Límites (vacío = ilimitado)</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {LIMITS.map((l) => (
              <label key={l.key} style={{ display: 'grid', gap: 2, fontSize: 13 }} title={l.description}>
                {l.label}
                <input style={input} type="number" min={0} name={`limit_${l.key}`} placeholder="ilimitado" defaultValue={limitVal(l.key)} />
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" style={btn}>{selectedKey ? 'Guardar cambios' : 'Crear plan'}</button>
      </form>

      <p style={{ ...mono, fontSize: 11, color: '#666', marginTop: 8 }}>
        Las claves de features/límites salen del catálogo canónico (@merkiai/tenancy).
      </p>
    </div>
  )
}
