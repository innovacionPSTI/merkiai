'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { Icon } from '@merkiai/ui'
import { applyPresetAction, type OnboardingActionState } from '../onboarding/actions'
import type { OnboardingOptions, OnboardingPreset } from '@/lib/onboarding'

const initial: OnboardingActionState = { ok: false }

/** Placeholder determinista (gradiente por nicho) cuando el preset no trae miniatura. */
function placeholderGradient(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `linear-gradient(135deg, hsl(${h} 55% 72%), hsl(${(h + 40) % 360} 55% 60%))`
}

function Thumb({ p }: { p: OnboardingPreset }) {
  if (p.thumbnail_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.thumbnail_url} alt={p.name} className="w-full h-40 object-cover" />
  }
  return (
    <div className="w-full h-40 flex items-center justify-center" style={{ background: placeholderGradient(p.niche || p.key) }}>
      <span className="font-brand text-white/90 text-lg font-semibold capitalize drop-shadow">{p.niche || p.name}</span>
    </div>
  )
}

/**
 * HU-250 · Galería de plantillas/presets. Filtro por industria (nicho) + búsqueda;
 * la miniatura es la vista previa (MVP, HU-257). "Aplicar" ejecuta el orquestador
 * (HU-235) respetando el plan; luego el comerciante previsualiza su tienda real.
 */
export default function PlantillasGallery({ options }: { options: OnboardingOptions }) {
  const [state, action, pending] = useActionState(applyPresetAction, initial)
  const [q, setQ] = useState('')
  const [niche, setNiche] = useState('all')

  const niches = useMemo(
    () => Array.from(new Set(options.presets.map((p) => p.niche).filter(Boolean))).sort(),
    [options.presets],
  )

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return options.presets.filter((p) => {
      if (niche !== 'all' && p.niche !== niche) return false
      if (!term) return true
      return [p.name, p.niche, p.description ?? '', p.key].some((s) => s.toLowerCase().includes(term))
    })
  }, [options.presets, q, niche])

  if (!options.presets.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="font-brand text-sm text-brand-primary/60">
          No hay plantillas disponibles para tu plan ({options.plan}). Pide a tu administrador que publique presets para este plan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/40"><Icon name="search" size={16} /></span>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, nicho o descripción…"
            className="w-full border border-black/10 rounded-xl pl-9 pr-3 py-2 font-brand text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <label className="font-brand text-sm text-brand-primary/70 inline-flex items-center gap-2">
          Industria
          <select value={niche} onChange={(e) => setNiche(e.target.value)} className="border border-black/10 rounded-xl px-3 py-2 text-sm">
            <option value="all">Todas</option>
            {niches.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="font-brand text-sm text-brand-primary/50">{filtered.length} plantilla(s)</span>
      </div>

      {/* Feedback de aplicar */}
      {state.error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 font-brand text-sm text-red-700">{state.error}</p>}
      {state.ok && state.message && <p className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 font-brand text-sm text-green-800">{state.message}</p>}

      {/* Rejilla */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.key} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 flex flex-col">
            <Thumb p={p} />
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-brand text-[11px] uppercase tracking-wider text-brand-primary/40">{p.niche}</span>
                <span className="font-brand text-[11px] text-brand-primary/30">· {p.template}</span>
              </div>
              <h3 className="font-display text-brand-primary text-lg mb-1">{p.name}</h3>
              {p.description && <p className="font-brand text-sm text-brand-primary/60 mb-4 line-clamp-2">{p.description}</p>}
              <form action={action} className="mt-auto">
                <input type="hidden" name="presetKey" value={p.key} />
                <input type="hidden" name="inventory_model" value="single" />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-brand-primary text-white px-4 py-2 font-brand text-sm disabled:opacity-50"
                  onClick={(e) => { if (!confirm(`¿Aplicar la plantilla «${p.name}» a tu tienda? No se duplica lo que ya tengas.`)) e.preventDefault() }}
                >
                  {pending ? 'Aplicando…' : 'Aplicar a mi tienda'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <p className="font-brand text-xs text-brand-primary/40">
        La miniatura es una referencia del estilo. Tras aplicar, usa «Vista previa» en el Constructor para ver tu tienda real.
      </p>
    </div>
  )
}
