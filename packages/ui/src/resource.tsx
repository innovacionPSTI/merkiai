'use client'

import * as React from 'react'
import { useState } from 'react'
import { Icon, type IconName } from './icon'

/**
 * Patrón "lista de recursos" compartido (HU-271): encabezado con botón
 * "Agregar X", tarjetas de los recursos ya configurados (con badge de estado,
 * pipeline opcional y acciones Editar/Quitar/Verificar) y un modal tipo wizard
 * para altas/ediciones guiadas. Es el estándar para pantallas de colección en
 * admin (Pagos, Dominios, Envíos…). Usa las clases brand-* del admin.
 */

// ── EnvBadge (Pruebas/Producción) ────────────────────────────────────────────
export type EnvKind = 'demo' | 'prod' | 'unknown'

export function EnvBadge({ env }: { env: EnvKind }) {
  if (env === 'unknown') return null
  const prod = env === 'prod'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-brand font-semibold ${
      prod ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-sky-100 text-sky-700 border border-sky-300'
    }`}>
      {prod ? '● Producción' : '○ Pruebas'}
    </span>
  )
}

// ── Pipeline de pasos (Validación → … → Activo) ──────────────────────────────
export function Pipeline({ steps, current, error }: { steps: readonly string[]; current: number; error?: boolean }) {
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center">
            <span className={`inline-flex items-center gap-1.5 font-brand text-sm ${done ? 'text-green-600' : active ? 'text-brand-primary' : 'text-brand-primary/40'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                done ? 'bg-green-600 text-white' : active ? (error ? 'bg-red-500 text-white' : 'bg-brand-primary text-brand-cream') : 'bg-gray-200 text-brand-primary/50'
              }`}>
                {done ? <Icon name="check" size={12} /> : i + 1}
              </span>
              {label}
            </span>
            {i < steps.length - 1 && <span className="mx-2 text-brand-primary/20">→</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Acción por tarjeta (Editar / Quitar / Verificar) ─────────────────────────
export function ResourceAction({ icon, label, onClick, tone = 'default', disabled, type = 'button' }: {
  icon: IconName; label: string; onClick?: () => void; tone?: 'default' | 'danger' | 'primary'; disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const toneCls =
    tone === 'danger' ? 'text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200'
    : tone === 'primary' ? 'text-brand-primary hover:bg-brand-primary hover:text-brand-cream border-brand-primary/40'
    : 'text-brand-primary/70 hover:bg-brand-cream border-brand-primary/15'
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-brand text-xs transition-colors disabled:opacity-40 ${toneCls}`}>
      <Icon name={icon} size={14} /> {label}
    </button>
  )
}

// ── Tarjeta de recurso ───────────────────────────────────────────────────────
export function ResourceItem({ title, subtitle, icon, badges, pipeline, actions, accent }: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  badges?: React.ReactNode
  pipeline?: React.ReactNode
  actions?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${accent ? 'border-brand-primary/40 ring-1 ring-brand-primary/10' : 'border-brand-primary/10'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          {icon && <span className="shrink-0 w-9 h-9 rounded-xl bg-brand-cream/60 flex items-center justify-center text-brand-primary">{icon}</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-brand-primary text-lg leading-tight">{title}</h3>
              {badges}
            </div>
            {subtitle && <p className="font-brand text-xs text-brand-primary/50 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {pipeline && <div className="mt-4">{pipeline}</div>}
    </div>
  )
}

// ── Lista de recursos (header + botón Agregar + estado vacío) ────────────────
export function ResourceList({ title, description, addLabel, onAdd, addDisabled, isEmpty, emptyText, emptyIcon, children }: {
  title?: React.ReactNode
  description?: React.ReactNode
  addLabel: string
  onAdd: () => void
  addDisabled?: boolean
  isEmpty: boolean
  emptyText?: React.ReactNode
  emptyIcon?: IconName
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {title && <h2 className="font-display text-brand-primary text-xl">{title}</h2>}
          {description && <p className="font-brand text-sm text-brand-primary/50 mt-1 max-w-2xl">{description}</p>}
        </div>
        <button type="button" onClick={onAdd} disabled={addDisabled}
          className="shrink-0 inline-flex items-center gap-2 bg-brand-primary text-brand-cream rounded-xl px-4 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40">
          <Icon name="plus" size={16} /> {addLabel}
        </button>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-dashed border-brand-primary/20 p-10 text-center">
          {emptyIcon && <span className="inline-flex w-12 h-12 rounded-2xl bg-brand-cream/60 items-center justify-center text-brand-primary/50 mb-3"><Icon name={emptyIcon} size={22} /></span>}
          <p className="font-brand text-sm text-brand-primary/50">{emptyText ?? 'Aún no has agregado nada.'}</p>
          <button type="button" onClick={onAdd} disabled={addDisabled}
            className="mt-4 inline-flex items-center gap-2 border border-brand-primary text-brand-primary rounded-xl px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors disabled:opacity-40">
            <Icon name="plus" size={15} /> {addLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  )
}

// ── ConfirmDialog (confirmación de marca; reemplaza window.confirm) · HU-364 ──
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger, onConfirm, onCancel, busy }: {
  open: boolean
  title: string
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5">
          <h2 className="font-display text-brand-primary text-lg">{title}</h2>
          {message && <div className="font-brand text-sm text-brand-primary/60 mt-2">{message}</div>}
        </div>
        <div className="p-4 border-t border-brand-primary/10 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary px-3 py-2">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={`rounded-xl px-5 py-2.5 font-brand text-sm text-white transition-colors disabled:opacity-40 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-primary hover:bg-brand-dark'}`}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PromptModal (formulario breve de marca; reemplaza window.prompt) · HU-364 ──
export interface PromptField {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  help?: string
  defaultValue?: string
}

export function PromptModal({ open, title, fields, submitLabel = 'Guardar', onSubmit, onClose, validate, busy }: {
  open: boolean
  title: string
  fields: PromptField[]
  submitLabel?: string
  onSubmit: (values: Record<string, string>) => void
  onClose: () => void
  /** Devuelve un mensaje de error (string) si los valores no son válidos, o null. */
  validate?: (values: Record<string, string>) => string | null
  busy?: boolean
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  React.useEffect(() => {
    if (open) setValues(Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ''])))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null

  const missing = fields.some((f) => f.required && !(values[f.key] ?? '').trim())
  const err = validate ? validate(values) : null
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label={title}>
      <form
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onSubmit={(e) => { e.preventDefault(); if (!missing && !err) onSubmit(values) }}
      >
        <div className="p-5 border-b border-brand-primary/10 flex items-center justify-between gap-3">
          <h2 className="font-display text-brand-primary text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="text-brand-primary/40 hover:text-brand-primary" aria-label="Cerrar"><Icon name="close" size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">{f.label}{f.required ? ' *' : ''}</label>
              <input
                autoFocus={f === fields[0]}
                value={values[f.key] ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {f.help && <p className="font-brand text-[11px] text-brand-primary/40 mt-0.5">{f.help}</p>}
            </div>
          ))}
          {err && <p className="font-brand text-xs text-red-500">{err}</p>}
        </div>
        <div className="p-4 border-t border-brand-primary/10 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary px-3 py-2">Cancelar</button>
          <button type="submit" disabled={missing || !!err || busy}
            className="rounded-xl px-5 py-2.5 font-brand text-sm bg-brand-primary text-brand-cream hover:bg-brand-dark transition-colors disabled:opacity-40">
            {busy ? 'Guardando…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── WizardModal (alta/edición guiada por pasos) ──────────────────────────────
export interface WizardStep {
  title: string
  /** Contenido del paso. */
  content: React.ReactNode
  /** Si es false, se bloquea avanzar (validación del paso). Por defecto true. */
  canAdvance?: boolean
}

export function WizardModal({ open, title, steps, onClose, onFinish, finishLabel = 'Finalizar', busy }: {
  open: boolean
  title: string
  steps: WizardStep[]
  onClose: () => void
  onFinish: () => void
  finishLabel?: string
  busy?: boolean
}) {
  const [step, setStep] = useState(0)
  // Reinicia al abrir.
  React.useEffect(() => { if (open) setStep(0) }, [open])
  if (!open) return null

  const cur = steps[Math.min(step, steps.length - 1)]
  const isLast = step >= steps.length - 1
  const canAdvance = cur?.canAdvance !== false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Encabezado + pasos */}
        <div className="p-5 border-b border-brand-primary/10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-brand-primary text-lg">{title}</h2>
            <button type="button" onClick={onClose} className="text-brand-primary/40 hover:text-brand-primary" aria-label="Cerrar">
              <Icon name="close" size={18} />
            </button>
          </div>
          {steps.length > 1 && (
            <div className="flex items-center gap-2 mt-3">
              {steps.map((s, i) => (
                <div key={s.title} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-brand ${
                    i < step ? 'bg-green-600 text-white' : i === step ? 'bg-brand-primary text-brand-cream' : 'bg-gray-200 text-brand-primary/50'
                  }`}>{i < step ? <Icon name="check" size={12} /> : i + 1}</span>
                  <span className={`font-brand text-xs ${i === step ? 'text-brand-primary font-semibold' : 'text-brand-primary/40'}`}>{s.title}</span>
                  {i < steps.length - 1 && <span className="text-brand-primary/20">→</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuerpo del paso */}
        <div className="p-5 overflow-y-auto flex-1">{cur?.content}</div>

        {/* Pie: navegación */}
        <div className="p-5 border-t border-brand-primary/10 flex items-center justify-between gap-3">
          <button type="button" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary px-3 py-2">
            {step === 0 ? 'Cancelar' : '← Atrás'}
          </button>
          {isLast ? (
            <button type="button" onClick={onFinish} disabled={!canAdvance || busy}
              className="inline-flex items-center gap-2 bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40">
              {busy ? 'Guardando…' : finishLabel}
            </button>
          ) : (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}
              className="inline-flex items-center gap-2 bg-brand-primary text-brand-cream rounded-xl px-5 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40">
              Continuar →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
