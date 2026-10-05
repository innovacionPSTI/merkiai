'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, contrastRatio, contrastLevel, type ContrastLevel } from '@merkiai/ui'
import { listTemplates } from '@merkiai/database/blocks'
import type { Theme } from '@merkiai/database'

// HU-121 · opciones de layout de la plantilla (del registro de templates).
const LAYOUT_OPTIONS = listTemplates().map((t) => ({
  value: t.name,
  label: t.label,
  description: t.description ?? '',
}))

// ── Constantes ────────────────────────────────────────────────────────────────

const FONT_DISPLAY_OPTIONS = [
  { value: 'cormorant',    label: 'Cormorant Garamond', sample: 'Serif elegante' },
  { value: 'playfair',     label: 'Playfair Display',   sample: 'Display clásico' },
  { value: 'lora',         label: 'Lora',               sample: 'Serif literario' },
  { value: 'merriweather', label: 'Merriweather',       sample: 'Serif legible' },
]
const FONT_BODY_OPTIONS = [
  { value: 'dm-sans',    label: 'DM Sans',     sample: 'Sans moderno' },
  { value: 'inter',      label: 'Inter',       sample: 'Sans neutro' },
  { value: 'montserrat', label: 'Montserrat',  sample: 'Sans geométrico' },
  { value: 'nunito',     label: 'Nunito',      sample: 'Sans redondeado' },
]

const COLOR_FIELDS: { key: keyof ThemeFormData; label: string; description: string }[] = [
  { key: 'color_primary',     label: 'Primario',         description: 'Color principal de botones, encabezados y elementos de énfasis' },
  { key: 'color_dark',        label: 'Oscuro',           description: 'Variante oscura del primario para hover y fondos profundos' },
  { key: 'color_cream',       label: 'Crema',            description: 'Fondo principal del sitio' },
  { key: 'color_cream_warm',  label: 'Crema cálida',     description: 'Fondo alternativo para secciones' },
  { key: 'color_yellow',      label: 'Amarillo',         description: 'Acentos cálidos y tarjetas destacadas' },
  { key: 'color_yellow_pale', label: 'Amarillo pálido',  description: 'Fondos de secciones secundarias' },
  { key: 'color_text',        label: 'Texto',            description: 'Color base del cuerpo de texto' },
  { key: 'color_price',       label: 'Precio',           description: 'Color del precio en las vistas de producto (HU-247)' },
]

// HU-247 · campos de la paleta oscura (solo visibles en modo auto/oscuro).
const DARK_FIELDS: { key: keyof ThemeFormData; label: string; description: string }[] = [
  { key: 'dark_bg',      label: 'Fondo oscuro',      description: 'Fondo principal en modo oscuro' },
  { key: 'dark_surface', label: 'Superficie oscura', description: 'Fondo de tarjetas y secciones en modo oscuro' },
  { key: 'dark_text',    label: 'Texto oscuro',      description: 'Color del texto en modo oscuro' },
]

const SCHEME_OPTIONS = [
  { value: 'light', label: 'Solo claro',  description: 'Siempre con la paleta clara' },
  { value: 'auto',  label: 'Automático',  description: 'Sigue el modo del sistema del visitante' },
  { value: 'dark',  label: 'Solo oscuro', description: 'Siempre con la paleta oscura' },
]

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ThemeFormData {
  name: string
  color_primary: string
  color_dark: string
  color_cream: string
  color_cream_warm: string
  color_yellow: string
  color_yellow_pale: string
  color_text: string
  color_price: string
  font_display: string
  font_body: string
  color_scheme: string
  dark_bg: string
  dark_surface: string
  dark_text: string
  template: string
}

const DEFAULT_FORM: ThemeFormData = {
  name:              '',
  color_primary:     '#614A2A',
  color_dark:        '#604B30',
  color_cream:       '#FFF0D1',
  color_cream_warm:  '#FFF1D3',
  color_yellow:      '#FFF6B8',
  color_yellow_pale: '#FDF8B9',
  color_text:        '#2D1A0A',
  color_price:       '#614A2A',
  font_display:      'cormorant',
  font_body:         'dm-sans',
  color_scheme:      'light',
  dark_bg:           '#1A1510',
  dark_surface:      '#241D15',
  dark_text:         '#F5EDE0',
  template:          'default',
}

function themeToForm(t: Theme): ThemeFormData {
  return {
    name:              t.name,
    color_primary:     t.color_primary,
    color_dark:        t.color_dark,
    color_cream:       t.color_cream,
    color_cream_warm:  t.color_cream_warm,
    color_yellow:      t.color_yellow,
    color_yellow_pale: t.color_yellow_pale,
    color_text:        t.color_text,
    color_price:       t.color_price ?? t.color_primary,
    font_display:      t.font_display,
    font_body:         t.font_body,
    color_scheme:      t.color_scheme ?? 'light',
    dark_bg:           t.dark_bg ?? DEFAULT_FORM.dark_bg,
    dark_surface:      t.dark_surface ?? DEFAULT_FORM.dark_surface,
    dark_text:         t.dark_text ?? DEFAULT_FORM.dark_text,
    template:          t.template ?? 'default',
  }
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

/** Mini preview que muestra cómo se verán los colores del tema */
function ThemePreview({ form }: { form: ThemeFormData }) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ background: form.color_cream }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: form.color_primary }}
      >
        <span className="font-semibold text-sm" style={{ color: form.color_cream }}>
          Mi Tienda
        </span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full opacity-50" style={{ background: form.color_cream }} />
          <div className="w-2 h-2 rounded-full opacity-50" style={{ background: form.color_cream }} />
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs mb-1" style={{ color: form.color_text + '80' }}>Encabezado</div>
          <div className="text-lg font-bold leading-tight" style={{ color: form.color_primary }}>
            Nombre del Producto
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: form.color_text + '80' }}>Párrafo</div>
          <div className="text-xs leading-relaxed" style={{ color: form.color_text }}>
            Descripción del producto con sus principales características.
          </div>
        </div>
        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: form.color_primary, color: form.color_cream }}
          >
            Comprar →
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{ borderColor: form.color_primary, color: form.color_primary, background: 'transparent' }}
          >
            Ver más
          </div>
        </div>
        {/* Paleta */}
        <div className="flex gap-1.5 pt-1">
          {[
            form.color_primary, form.color_dark, form.color_cream,
            form.color_yellow, form.color_text,
          ].map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-black/10"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Verificación de contraste WCAG (HU-247/248) de los pares clave del tema. */
function ContrastCheck({ form }: { form: ThemeFormData }) {
  const pairs: { label: string; fg: string; bg: string }[] = [
    { label: 'Texto sobre fondo', fg: form.color_text, bg: form.color_cream },
    { label: 'Marca sobre fondo', fg: form.color_primary, bg: form.color_cream },
    { label: 'Fondo sobre botón', fg: form.color_cream, bg: form.color_primary },
  ]
  const tone: Record<ContrastLevel, string> = {
    AAA: 'bg-green-100 text-green-700',
    AA: 'bg-green-100 text-green-700',
    'AA Large': 'bg-yellow-100 text-yellow-700',
    Fail: 'bg-red-100 text-red-600',
  }
  const rows = pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg)
    return { ...p, ratio, level: contrastLevel(ratio) }
  })
  const failing = rows.filter((r) => r.level === 'Fail').length

  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-700">Verificación de contraste</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${failing ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          <Icon name={failing ? 'alert' : 'check'} size={13} />
          {failing ? `${failing} con problemas` : 'Todo correcto'}
        </span>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-gray-600">
              <span className="w-4 h-4 rounded border border-black/10" style={{ background: r.bg }}>
                <span className="block w-2 h-2 m-1 rounded-sm" style={{ background: r.fg }} />
              </span>
              {r.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums text-gray-500">{r.ratio.toFixed(2)}:1</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full ${tone[r.level]}`}>{r.level}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-400 mt-3">WCAG 2.1 — AA requiere ≥ 4.5:1 (texto normal).</p>
    </div>
  )
}

/** Card de un tema en la lista */
function ThemeCard({
  theme,
  onEdit,
  onActivate,
  onDelete,
  isPending,
}: {
  theme: Theme
  onEdit: (t: Theme) => void
  onActivate: (id: number) => void
  onDelete: (id: number) => void
  isPending: boolean
}) {
  const canDelete = !theme.is_active && !theme.is_default

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        theme.is_active
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header de la card */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{theme.name}</span>
            {theme.is_active && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Activo
              </span>
            )}
            {theme.is_default && !theme.is_active && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Por defecto
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {FONT_DISPLAY_OPTIONS.find(f => f.value === theme.font_display)?.label ?? theme.font_display}
            {' · '}
            {FONT_BODY_OPTIONS.find(f => f.value === theme.font_body)?.label ?? theme.font_body}
          </div>
        </div>
      </div>

      {/* Paleta de colores */}
      <div className="flex gap-1.5 mb-4">
        {[
          theme.color_primary, theme.color_dark, theme.color_cream,
          theme.color_yellow, theme.color_cream_warm, theme.color_text,
        ].map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(theme)}
          className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Editar
        </button>
        <a
          href={`/api/admin/themes/${theme.id}/export`}
          className="py-1.5 px-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center"
          title="Exportar plantilla (.json)"
          aria-label={`Exportar plantilla ${theme.name}`}
        >
          <Icon name="external" size={14} />
        </a>
        {!theme.is_active && (
          <button
            onClick={() => onActivate(theme.id)}
            disabled={isPending}
            className="flex-1 py-1.5 text-xs font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            Activar
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(theme.id)}
            disabled={isPending}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar tema"
            aria-label={`Eliminar tema ${theme.name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

/** Modal de crear/editar tema */
function ThemeModal({
  editing,
  form,
  setForm,
  onSave,
  onClose,
  isSaving,
}: {
  editing: Theme | null
  form: ThemeFormData
  setForm: (f: ThemeFormData) => void
  onSave: () => void
  onClose: () => void
  isSaving: boolean
}) {
  function update<K extends keyof ThemeFormData>(key: K, value: ThemeFormData[K]) {
    setForm({ ...form, [key]: value })
  }

  // HU-248 a11y: cerrar con Escape y enfocar el primer campo al abrir.
  const firstFieldRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    firstFieldRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const titleId = 'theme-modal-title'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 id={titleId} className="font-semibold text-gray-900">
            {editing ? 'Editar tema' : 'Nuevo tema'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-3 space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del tema</label>
              <input
                ref={firstFieldRef}
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ej: Temporada Navideña"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            {/* Colores */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Paleta de colores</div>
              <div className="space-y-2">
                {COLOR_FIELDS.map(({ key, label, description }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form[key] as string}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-400 truncate">{description}</div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">{(form[key] as string).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipografía */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Tipografía</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Encabezados (display)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_DISPLAY_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => update('font_display', f.value)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          form.font_display === f.value
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-800">{f.label}</div>
                        <div className="text-xs text-gray-400">{f.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Cuerpo de texto (body)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_BODY_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => update('font_body', f.value)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          form.font_body === f.value
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-800">{f.label}</div>
                        <div className="text-xs text-gray-400">{f.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layout de la plantilla (HU-121) */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Disposición del inicio</div>
              <p className="text-[11px] text-gray-400 mb-2 leading-tight">La plantilla define paleta, tipografía y la disposición del home juntas.</p>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => update('template', l.value)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      form.template === l.value
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-800">{l.label}</div>
                    {l.description && <div className="text-[11px] text-gray-400 leading-tight">{l.description}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Modo de color (HU-247) */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Modo de color</div>
              <div className="grid grid-cols-3 gap-2">
                {SCHEME_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => update('color_scheme', s.value)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      form.color_scheme === s.value
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-800">{s.label}</div>
                    <div className="text-[11px] text-gray-400 leading-tight">{s.description}</div>
                  </button>
                ))}
              </div>

              {form.color_scheme !== 'light' && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500">Paleta oscura</div>
                  {DARK_FIELDS.map(({ key, label, description }) => (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form[key] as string}
                        onChange={(e) => update(key, e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800">{label}</div>
                        <div className="text-xs text-gray-400 truncate">{description}</div>
                      </div>
                      <span className="text-xs font-mono text-gray-400">{(form[key] as string).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Vista previa</div>
            <ThemePreview form={form} />
            <ContrastCheck form={form} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !form.name.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tema'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TemasClient({ initialThemes }: { initialThemes: Theme[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Estado de lista
  const [themes, setThemes] = useState<Theme[]>(initialThemes)

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [form, setForm] = useState<ThemeFormData>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingTheme(null)
    setForm(DEFAULT_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(theme: Theme) {
    setEditingTheme(theme)
    setForm(themeToForm(theme))
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTheme(null)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setIsSaving(true)
    setError(null)

    try {
      if (editingTheme) {
        // Actualizar
        const res = await fetch(`/api/admin/themes/${editingTheme.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const j = await res.json()
          throw new Error(j.error ?? 'Error al guardar')
        }
        const { theme } = await res.json()
        setThemes((prev) => prev.map((t) => (t.id === theme.id ? theme : t)))
      } else {
        // Crear
        const res = await fetch('/api/admin/themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const j = await res.json()
          throw new Error(j.error ?? 'Error al crear')
        }
        const { theme } = await res.json()
        setThemes((prev) => [...prev, theme])
      }
      closeModal()
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleActivate(id: number) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/themes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setActive: true }),
      })
      if (res.ok) {
        setThemes((prev) => prev.map((t) => ({ ...t, is_active: t.id === id })))
        router.refresh()
      }
    })
  }

  // HU-129 · importar paquete de plantilla (.json) → tema inactivo
  async function handleImportFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      const pkg = JSON.parse(text)
      const res = await fetch('/api/admin/themes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'No se pudo importar la plantilla')
      const { theme } = await res.json()
      setThemes((prev) => [...prev, theme])
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archivo de plantilla inválido')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este tema?')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/themes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setThemes((prev) => prev.filter((t) => t.id !== id))
      } else {
        const j = await res.json()
        alert(j.error ?? 'No se pudo eliminar')
      }
    })
  }

  return (
    <>
      {/* Barra de acción */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          {themes.length} tema{themes.length !== 1 ? 's' : ''} configurado{themes.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            <Icon name="external" size={15} /> Importar plantilla
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImportFile(f)
                e.target.value = ''
              }}
            />
          </label>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-brand-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo tema
          </button>
        </div>
      </div>

      {/* Grid de temas */}
      {themes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="flex justify-center mb-3"><Icon name="palette" size={32} /></div>
          <div className="text-sm">No hay temas. Crea el primero.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onEdit={openEdit}
              onActivate={handleActivate}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Nota informativa */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Nota:</strong> Los cambios de tema se reflejan en el sitio web en la próxima carga de página.
        El tema predeterminado no se puede eliminar.
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ThemeModal
          editing={editingTheme}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeModal}
          isSaving={isSaving}
        />
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-3 opacity-70 hover:opacity-100 inline-flex align-middle"><Icon name="close" size={15} /></button>
        </div>
      )}
    </>
  )
}
