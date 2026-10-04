'use client'

import { useActionState, useState } from 'react'
import { Icon } from '@merkiai/ui'
import { applyPresetAction, setOnboardingDoneAction, type OnboardingActionState } from './actions'
import type { OnboardingOptions, OnboardingProgress } from '@/lib/onboarding'

const initial: OnboardingActionState = { ok: false }

/**
 * Wizard de onboarding (HU-236 / v2 reanudable). Solo ofrece lo habilitado por
 * el plan: los presets ya vienen filtrados por plan y el selector de inventario
 * multi-ubicación solo aparece si el plan lo permite. El enforcement real es
 * server-side. El `progress` (HU-236 v2) refleja el estado persistido en
 * `store_config.onboarding_state` + señales reales de la tienda, para que el
 * comerciante retome donde lo dejó.
 */
export default function OnboardingWizard({ options, progress }: { options: OnboardingOptions; progress: OnboardingProgress }) {
  const [state, action, pending] = useActionState(applyPresetAction, initial)
  const presetApplied = progress.state.presetApplied
  // Pre-selecciona el preset ya aplicado si existe (reanudar), si no el primero.
  const [selected, setSelected] = useState<string>(presetApplied ?? options.presets[0]?.key ?? '')
  const [inventory, setInventory] = useState<'single' | 'multi_location'>('single')

  const preset = options.presets.find((p) => p.key === selected)
  const catCap = options.limits.categories
  const prodCap = options.limits.products
  const catCount = Math.min(preset?.sample_categories.length ?? 0, catCap ?? Infinity)
  const prodCount = Math.min(preset?.sample_products.length ?? 0, prodCap ?? Infinity)

  if (!options.presets.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="font-brand text-sm text-brand-primary/60">
          No hay presets disponibles para tu plan ({options.plan}). Configura tu tienda desde las
          secciones del panel, o pide a tu administrador que publique presets para este plan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* HU-236 v2 · Progreso reanudable */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-brand-primary text-xl">Tu progreso</h2>
          <span className="font-brand text-sm text-brand-primary/60">{progress.percent}% ({progress.completedCount}/{progress.totalCount})</span>
        </div>
        <div className="h-2 bg-brand-primary/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <ul className="font-brand text-sm space-y-2">
          {progress.checklist.map((it) => (
            <li key={it.key}>
              <a href={it.href} className="inline-flex items-center gap-2 hover:underline">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${it.done ? 'bg-green-100 text-green-600' : 'border border-brand-primary/20 text-transparent'}`}>
                  <Icon name="check" size={13} />
                </span>
                <span className={it.done ? 'text-brand-primary/50 line-through' : 'text-brand-primary'}>{it.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {progress.finished ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
            <span className="font-brand text-sm text-green-800 inline-flex items-center gap-2">
              <Icon name="check" size={16} /> {progress.state.completedAt ? 'Onboarding completado.' : 'Onboarding omitido.'} Puedes seguir ajustando tu tienda desde el panel.
            </span>
            <form action={setOnboardingDoneAction}>
              <input type="hidden" name="intent" value="reopen" />
              <button type="submit" className="font-brand text-sm text-green-800 underline whitespace-nowrap">Reabrir</button>
            </form>
          </div>
        ) : (
          <div className="mt-4 flex gap-3">
            <form action={setOnboardingDoneAction}>
              <input type="hidden" name="intent" value="complete" />
              <button type="submit" className="rounded-xl bg-brand-primary text-white px-4 py-2 font-brand text-sm">Marcar como completado</button>
            </form>
            <form action={setOnboardingDoneAction}>
              <input type="hidden" name="intent" value="dismiss" />
              <button type="submit" className="rounded-xl border border-black/10 px-4 py-2 font-brand text-sm text-brand-primary/70">Omitir por ahora</button>
            </form>
          </div>
        )}
      </section>

    <form action={action} className="space-y-8">
      {/* Paso 1 · Nicho / preset */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-brand-primary text-xl mb-1">1 · Elige un punto de partida</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Un preset configura la apariencia y el contenido inicial de tu tienda según tu nicho. Podrás
          ajustarlo todo después.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.presets.map((p) => (
            <label
              key={p.key}
              className={`block rounded-xl border p-4 cursor-pointer transition ${
                selected === p.key ? 'border-brand-primary bg-brand-primary/5' : 'border-black/10 hover:border-black/20'
              }`}
            >
              <input
                type="radio"
                name="presetKey"
                value={p.key}
                checked={selected === p.key}
                onChange={() => setSelected(p.key)}
                className="sr-only"
              />
              <span className="font-brand text-xs uppercase tracking-wider text-brand-primary/40">{p.niche}</span>
              <span className="block font-display text-brand-primary text-lg">{p.name}</span>
              {p.description && <span className="block font-brand text-sm text-brand-primary/60 mt-1">{p.description}</span>}
            </label>
          ))}
        </div>
      </section>

      {/* Paso 2 · Inventario (solo si el plan lo permite) */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-brand-primary text-xl mb-1">2 · Modelo de inventario</h2>
        {options.allowMultiLocation ? (
          <>
            <p className="font-brand text-sm text-brand-primary/50 mb-4">
              Tu plan permite gestionar stock por sucursal. Elige cómo llevar el inventario.
            </p>
            <div className="flex gap-3">
              {(['single', 'multi_location'] as const).map((m) => (
                <label
                  key={m}
                  className={`flex-1 rounded-xl border p-4 cursor-pointer text-center transition ${
                    inventory === m ? 'border-brand-primary bg-brand-primary/5' : 'border-black/10 hover:border-black/20'
                  }`}
                >
                  <input type="radio" name="inventory_model" value={m} checked={inventory === m}
                    onChange={() => setInventory(m)} className="sr-only" />
                  <span className="font-display text-brand-primary">{m === 'single' ? 'Stock único' : 'Multi-ubicación'}</span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="font-brand text-sm text-brand-primary/50">
            Tu plan usa stock único por producto. La gestión por sucursales está disponible en planes superiores.
            <input type="hidden" name="inventory_model" value="single" />
          </p>
        )}
      </section>

      {/* Paso 3 · Resumen + aplicar */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-brand-primary text-xl mb-1">3 · Aplicar</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">
          Se aplicará la apariencia del preset y se crearán {catCount} categoría(s) y {prodCount} producto(s) de
          ejemplo{catCap != null || prodCap != null ? ' (ajustado a los topes de tu plan)' : ''}. No se duplica lo
          que ya tengas.
        </p>
        {presetApplied && (
          <p className="mb-3 font-brand text-sm text-brand-primary/60 inline-flex items-center gap-2">
            <Icon name="check" size={15} className="text-green-600" />
            Ya aplicaste «{presetApplied}». Puedes reaplicar el mismo u otro preset; no se duplica lo que ya tengas.
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !selected}
          className="rounded-xl bg-brand-primary text-white px-5 py-2.5 font-brand text-sm disabled:opacity-50"
        >
          {pending ? 'Aplicando…' : presetApplied ? 'Reaplicar preset' : 'Aplicar preset a mi tienda'}
        </button>
        {state.error && <p className="mt-3 font-brand text-sm text-red-600">{state.error}</p>}
        {state.ok && state.message && <p className="mt-3 font-brand text-sm text-green-600">{state.message}</p>}
      </section>

      {/* Otros pasos (desde su propia sección; no cuentan en el progreso) */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-brand-primary text-xl mb-1">Otros ajustes</h2>
        <p className="font-brand text-sm text-brand-primary/50 mb-4">Se configuran desde su propia sección:</p>
        <ul className="font-brand text-sm text-brand-primary space-y-2">
          {[
            { href: '/constructor', label: 'Diseñar las páginas (Constructor)' },
            { href: '/configuracion/dominio', label: 'Conectar tu dominio propio' },
            { href: '/configuracion/envios', label: 'Envíos' },
          ].map((it) => (
            <li key={it.href}>
              <a className="inline-flex items-center gap-1.5 hover:underline" href={it.href}>
                {it.label} <Icon name="chevron-right" size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </form>
    </div>
  )
}
