'use client'

import { useRef, useState } from 'react'

type ActiveProvider = 'none' | 'wompi' | 'mercadopago' | 'tucompra' | 'bold'

interface PaymentConfigData {
  active_provider: ActiveProvider
  wompi_public_key: string | null
  wompi_private_key: string | null
  wompi_integrity_secret: string | null
  wompi_events_secret: string | null
  mercadopago_access_token: string | null
  mercadopago_public_key: string | null
  tucompra_user: string | null
  tucompra_terminal: string | null
  tucompra_api_url: string | null
  tucompra_methods: unknown
  tucompra_sandbox: boolean
  bold_api_key: string | null
  bold_sandbox: boolean
  has_wompi_private_key: boolean
  has_wompi_integrity_secret: boolean
  has_wompi_events_secret: boolean
  has_mercadopago_access_token: boolean
  has_tucompra_password: boolean
  has_tucompra_public_key: boolean
  has_bold_secret_key: boolean
}

interface Props {
  initialConfig: PaymentConfigData | null
}

// Orden y etiquetas del menú horizontal. 'none' = pago manual.
const TABS: { value: ActiveProvider; label: string; desc: string }[] = [
  { value: 'wompi',       label: 'Wompi',        desc: 'Tarjeta débito/crédito, PSE, Bancolombia Button' },
  { value: 'mercadopago', label: 'MercadoPago',  desc: 'Tarjeta, efectivo, Nequi, Daviplata' },
  { value: 'tucompra',    label: 'Tu Compra',    desc: 'Tarjeta, efectivo, Nequi, PSE' },
  { value: 'bold',        label: 'Bold',         desc: 'Tarjeta, PSE, Nequi, Botón Bancolombia' },
  { value: 'none',        label: 'Pago manual',  desc: 'Sin pago en línea; el administrador valida el pago de cada pedido.' },
]

const PROVIDER_LABEL: Record<ActiveProvider, string> = {
  none: 'Pago manual', wompi: 'Wompi', mercadopago: 'MercadoPago', tucompra: 'Tu Compra', bold: 'Bold',
}

const STRING_FIELDS = [
  'wompi_public_key', 'wompi_private_key', 'wompi_integrity_secret', 'wompi_events_secret',
  'mercadopago_access_token', 'mercadopago_public_key',
  'tucompra_user', 'tucompra_password', 'tucompra_terminal', 'tucompra_api_url', 'tucompra_public_key',
  'bold_api_key', 'bold_secret_key',
]

// Base pública donde viven los handlers de webhook (app web). Generalizada por env.
const WEBHOOK_BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

/** URL de webhook de una pasarela, copiable para registrarla en su cuenta. */
function WebhookUrl({ provider, note }: { provider: string; note?: string }) {
  const url = WEBHOOK_BASE
    ? `${WEBHOOK_BASE}/api/webhooks/${provider}`
    : `https://tu-dominio.com/api/webhooks/${provider}`
  const [copied, setCopied] = useState(false)

  return (
    <div className="mt-2 rounded-xl border border-brand-primary/10 bg-brand-cream/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-brand text-xs font-semibold text-brand-primary/70">URL de webhook</p>
          <p className="font-mono text-xs text-brand-primary/60 truncate">{url}</p>
        </div>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="shrink-0 font-brand text-xs text-brand-primary underline hover:text-brand-dark"
        >
          {copied ? '✓ Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="font-brand text-[11px] text-brand-primary/40 mt-1">
        {!WEBHOOK_BASE && 'Configura NEXT_PUBLIC_SITE_URL para generar la URL real. '}
        {note}
      </p>
    </div>
  )
}

/** URL parametrizada copiable (para pegar en el panel de la pasarela). */
function CopyableUrl({ label, path, note }: { label: string; path: string; note?: string }) {
  const url = WEBHOOK_BASE ? `${WEBHOOK_BASE}${path}` : `https://tu-dominio.com${path}`
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-2 rounded-xl border border-brand-primary/10 bg-brand-cream/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-brand text-xs font-semibold text-brand-primary/70">{label}</p>
          <p className="font-mono text-xs text-brand-primary/60 truncate">{url}</p>
        </div>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="shrink-0 font-brand text-xs text-brand-primary underline hover:text-brand-dark"
        >
          {copied ? '✓ Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="font-brand text-[11px] text-brand-primary/40 mt-1">
        {!WEBHOOK_BASE && 'Configura NEXT_PUBLIC_SITE_URL para generar la URL real. '}
        {note}
      </p>
    </div>
  )
}

// ── Entorno (Demo/Producción) ─────────────────────────────────────
type Env = 'demo' | 'prod' | 'unknown'

/** URLs del API de Tu Compra por entorno. */
const TC_URLS = {
  demo: 'https://ws.tucompra.net/tcWSDRest/api',
  prod: 'https://ws2.tucompra.com.co/tcWSDRest/api',
}

/** Catálogo de medios de pago de Tu Compra (modalidad integrador). */
const TC_METHODS: { tipo: string; label: string; icon: string; desc: string; pci?: boolean }[] = [
  { tipo: 'pse',          label: 'PSE',          icon: '🏦', desc: 'Débito bancario en línea (redirección al banco)' },
  { tipo: 'nequi',        label: 'Nequi',        icon: '📲', desc: 'Billetera móvil — notificación push al celular' },
  { tipo: 'daviplata',    label: 'Daviplata',    icon: '📱', desc: 'Billetera móvil Davivienda' },
  { tipo: 'referenciado', label: 'Referenciado', icon: '🧾', desc: 'Efectivo en corresponsales / bancos' },
  { tipo: 'tarjeta',      label: 'Tarjeta',      icon: '💳', desc: 'Crédito/débito — requiere cifrado RSA (afecta PCI SAQ A)', pci: true },
]

/** IDs de método por entorno (difieren demo/prod — Tabla de Valores Tu Compra). */
const TC_IDS: Record<'demo' | 'prod', Record<string, string>> = {
  demo: { pse: '41', nequi: '72', daviplata: '71', referenciado: '45', tarjeta: '37' },
  prod: { pse: '3',  nequi: '72', daviplata: '71', referenciado: '45', tarjeta: '2'  },
}

function tucompraEnv(apiUrl: string | null | undefined): Env {
  if (!apiUrl) return 'demo'
  return /ws2\.tucompra\.com\.co/i.test(apiUrl) ? 'prod' : 'demo'
}
function wompiEnv(pk: string | null | undefined): Env {
  if (!pk) return 'unknown'
  if (pk.startsWith('pub_prod')) return 'prod'
  if (pk.startsWith('pub_test')) return 'demo'
  return 'unknown'
}
function mpEnv(pk: string | null | undefined): Env {
  if (!pk) return 'unknown'
  if (pk.startsWith('APP_USR')) return 'prod'
  if (pk.startsWith('TEST')) return 'demo'
  return 'unknown'
}

/** Chip visual que indica el entorno de una pasarela. */
function EnvBadge({ env }: { env: Env }) {
  if (env === 'unknown') return null
  const prod = env === 'prod'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-brand font-semibold ${
      prod ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-sky-100 text-sky-700 border border-sky-300'
    }`}>
      {prod ? '● Producción' : '○ Demo · pruebas'}
    </span>
  )
}

/**
 * Selector visual de medios de pago de Tu Compra: toggle de entorno (Demo/Producción),
 * lista con switches para habilitar y arrastrar-y-soltar para ordenar. Los IDs se
 * autocompletan según el entorno (con override avanzado). Serializa a los hidden inputs
 * `tucompra_api_url` y `tucompra_methods_json` que consume el formulario.
 */
function TuCompraMethods({ initial, initialEnv }: {
  initial: Array<{ tipo: string; id?: string; enabled?: boolean }>
  initialEnv: Env
}) {
  const [env, setEnv] = useState<'demo' | 'prod'>(initialEnv === 'prod' ? 'prod' : 'demo')
  const [advanced, setAdvanced] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [rows, setRows] = useState<Array<{ tipo: string; enabled: boolean; override?: string }>>(() => {
    const seen = new Set<string>()
    const ordered: Array<{ tipo: string; enabled: boolean; override?: string }> = []
    for (const m of initial) {
      if (TC_METHODS.some((c) => c.tipo === m.tipo) && !seen.has(m.tipo)) {
        ordered.push({ tipo: m.tipo, enabled: m.enabled !== false, override: m.id })
        seen.add(m.tipo)
      }
    }
    for (const c of TC_METHODS) {
      if (!seen.has(c.tipo)) ordered.push({ tipo: c.tipo, enabled: false })
    }
    return ordered
  })
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const apiUrl = customUrl.trim() || TC_URLS[env]
  const idFor = (tipo: string, override?: string) => (override?.trim() || TC_IDS[env][tipo] || '')
  const methodsJson = JSON.stringify(
    rows.map((r) => ({ tipo: r.tipo, id: idFor(r.tipo, r.override), enabled: r.enabled })),
  )
  const enabledCount = rows.filter((r) => r.enabled).length

  function move(from: number, to: number) {
    if (from === to) return
    setRows((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }
  const toggle = (i: number) => setRows((p) => p.map((r, j) => (j === i ? { ...r, enabled: !r.enabled } : r)))
  const setOverride = (i: number, v: string) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, override: v || undefined } : r)))

  const meta = (tipo: string) => TC_METHODS.find((c) => c.tipo === tipo)!

  return (
    <div className="space-y-4">
      {/* Hidden inputs que consume buildFields */}
      <input type="hidden" name="tucompra_api_url" value={apiUrl} readOnly />
      <input type="hidden" name="tucompra_methods_json" value={methodsJson} readOnly />

      {/* Toggle de entorno */}
      <div>
        <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">Entorno</label>
        <div className="inline-flex rounded-xl border border-brand-primary/20 p-1 bg-brand-cream/40">
          <button
            type="button"
            onClick={() => setEnv('demo')}
            className={`px-4 py-1.5 rounded-lg font-brand text-sm font-medium transition-colors ${
              env === 'demo' ? 'bg-sky-500 text-white shadow-sm' : 'text-brand-primary/60 hover:text-brand-primary'
            }`}
          >
            ○ Demo · pruebas
          </button>
          <button
            type="button"
            onClick={() => setEnv('prod')}
            className={`px-4 py-1.5 rounded-lg font-brand text-sm font-medium transition-colors ${
              env === 'prod' ? 'bg-amber-500 text-white shadow-sm' : 'text-brand-primary/60 hover:text-brand-primary'
            }`}
          >
            ● Producción
          </button>
        </div>
        <p className="font-brand text-xs text-brand-primary/40 mt-1.5">
          {env === 'demo'
            ? 'Las transacciones no cobran dinero real. Ideal para probar el flujo.'
            : '⚠ Cobros reales a los clientes. Verifica credenciales de producción.'}
          {' '}API: <code className="text-brand-primary/60">{apiUrl}</code>
        </p>
      </div>

      {/* Lista de medios */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-brand text-sm font-semibold text-brand-primary">Medios de pago</label>
          <span className="font-brand text-xs text-brand-primary/40">
            {enabledCount} habilitado{enabledCount === 1 ? '' : 's'} · arrastra para ordenar
          </span>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => {
            const m = meta(r.tipo)
            return (
              <div
                key={r.tipo}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { move(dragIdx, i); setDragIdx(i) } }}
                onDragEnd={() => setDragIdx(null)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 bg-white transition-colors ${
                  r.enabled ? 'border-brand-primary/20' : 'border-brand-primary/10 opacity-60'
                } ${dragIdx === i ? 'ring-2 ring-brand-primary/30' : ''}`}
              >
                <span className="cursor-grab select-none text-brand-primary/30 text-lg leading-none" title="Arrastrar">⠿</span>
                <span className="text-xl leading-none">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-brand text-sm font-semibold text-brand-primary">{m.label}</span>
                    <span className="font-mono text-[11px] text-brand-primary/40">id&nbsp;{idFor(r.tipo, r.override)}</span>
                    {m.pci && <span className="rounded bg-red-50 border border-red-200 text-red-600 text-[10px] font-brand px-1.5 py-0.5">PCI</span>}
                  </div>
                  <p className="font-brand text-[11px] text-brand-primary/40 truncate">{m.desc}</p>
                </div>
                {/* Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.enabled}
                  onClick={() => toggle(i)}
                  className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${r.enabled ? 'bg-green-500' : 'bg-brand-primary/20'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${r.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Avanzado: override manual de IDs y URL */}
      <div>
        <button type="button" onClick={() => setAdvanced((v) => !v)} className="font-brand text-xs text-brand-primary/60 underline hover:text-brand-primary">
          {advanced ? '▾ Ocultar opciones avanzadas' : '▸ Opciones avanzadas (IDs / URL personalizada)'}
        </button>
        {advanced && (
          <div className="mt-2 rounded-xl border border-brand-primary/10 bg-brand-cream/20 p-3 space-y-3">
            <div>
              <label className="font-brand text-xs font-semibold text-brand-primary/70 block mb-1">URL del API personalizada (opcional)</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={`Por defecto: ${TC_URLS[env]}`}
                className="w-full border border-brand-primary/20 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-brand-primary"
              />
              <p className="font-brand text-[11px] text-brand-primary/40 mt-1">Déjala vacía para usar la URL estándar del entorno seleccionado.</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-brand text-xs font-semibold text-brand-primary/70">IDs de método (sobrescribir)</p>
              {rows.map((r, i) => {
                const m = meta(r.tipo)
                return (
                  <div key={r.tipo} className="flex items-center gap-2">
                    <span className="font-brand text-xs text-brand-primary/60 w-24">{m.label}</span>
                    <input
                      type="text"
                      value={r.override ?? ''}
                      onChange={(e) => setOverride(i, e.target.value)}
                      placeholder={`auto: ${TC_IDS[env][r.tipo]}`}
                      className="flex-1 border border-brand-primary/20 rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SecretInput({ label, name, hasExisting, placeholder, hint }: {
  label: string; name: string; hasExisting: boolean; placeholder?: string; hint?: string
}) {
  const [changing, setChanging] = useState(false)
  return (
    <div>
      <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">{label}</label>
      {hasExisting && !changing ? (
        <div className="flex items-center gap-3">
          <span className="flex-1 border border-brand-primary/10 rounded-xl px-4 py-2.5 font-mono text-sm text-brand-primary/40 bg-gray-50">
            ••••••••••••
          </span>
          <button type="button" onClick={() => setChanging(true)} className="font-brand text-xs text-brand-primary underline hover:text-brand-dark">
            Cambiar
          </button>
        </div>
      ) : (
        <input
          type="password"
          name={name}
          placeholder={placeholder ?? 'Nueva llave…'}
          autoComplete="off"
          className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary"
        />
      )}
      {hint && <p className="font-brand text-xs text-brand-primary/40 mt-1">{hint}</p>}
    </div>
  )
}

export default function PaymentConfigForm({ initialConfig }: Props) {
  const cfg = initialConfig
  const formRef = useRef<HTMLFormElement>(null)

  const [activeProvider, setActiveProvider] = useState<ActiveProvider>(cfg?.active_provider ?? 'none')
  // El tab visible arranca en la pasarela activa (o Wompi si es manual).
  const [tab, setTab] = useState<ActiveProvider>(cfg?.active_provider && cfg.active_provider !== 'none' ? cfg.active_provider : 'wompi')

  const [saving, setSaving] = useState(false)         // guardando credenciales
  const [activating, setActivating] = useState<ActiveProvider | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function buildFields(fd: FormData): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      tucompra_sandbox: fd.get('tucompra_sandbox') === 'on',
      bold_sandbox: fd.get('bold_sandbox') === 'on',
    }
    for (const field of STRING_FIELDS) {
      const val = fd.get(field)
      if (typeof val === 'string' && val.trim()) payload[field] = val.trim()
    }
    // Medios de Tu Compra: JSON editable [{tipo,id,enabled}]
    const tcm = fd.get('tucompra_methods_json')
    if (typeof tcm === 'string' && tcm.trim()) {
      try {
        const parsed = JSON.parse(tcm)
        if (Array.isArray(parsed)) payload.tucompra_methods = parsed
      } catch { /* JSON inválido → se ignora, no se sobreescribe */ }
    }
    return payload
  }

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch('/api/admin/payment-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const missing = Array.isArray(data.missing) && data.missing.length ? ` (faltan: ${data.missing.join(', ')})` : ''
      throw new Error(`${data.error ?? 'Error'}${missing}`)
    }
    return res.json()
  }

  // Guardar credenciales SIN cambiar la pasarela activa.
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      await patch(buildFields(new FormData(e.currentTarget)))
      setMsg({ type: 'ok', text: '✓ Credenciales guardadas' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setSaving(false)
    }
  }

  // Activar una pasarela: guarda lo escrito + la marca como activa (valida credenciales).
  async function handleActivate(provider: ActiveProvider) {
    if (!formRef.current) return
    setActivating(provider); setMsg(null)
    try {
      const payload = buildFields(new FormData(formRef.current))
      payload.active_provider = provider
      await patch(payload)
      setActiveProvider(provider)
      setMsg({ type: 'ok', text: provider === 'none' ? '✓ Pago manual activado' : `✓ ${PROVIDER_LABEL[provider]} es ahora la pasarela activa` })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setActivating(null)
    }
  }

  /** Fila de activación que se muestra al pie de cada tab. */
  const ActivateRow = ({ provider }: { provider: ActiveProvider }) => (
    activeProvider === provider ? (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
        <span className="font-brand text-sm font-semibold text-green-700">● Esta es la pasarela activa</span>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => handleActivate(provider)}
        disabled={activating !== null}
        className="w-full rounded-xl bg-brand-primary text-brand-cream py-2.5 font-brand text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        {activating === provider ? 'Activando…' : (provider === 'none' ? 'Activar pago manual' : `Activar ${PROVIDER_LABEL[provider]}`)}
      </button>
    )
  )

  // Entorno detectado por pasarela (a partir de la config guardada).
  const envOf: Record<ActiveProvider, Env> = {
    none: 'unknown',
    wompi: wompiEnv(cfg?.wompi_public_key),
    mercadopago: mpEnv(cfg?.mercadopago_public_key),
    tucompra: tucompraEnv(cfg?.tucompra_api_url),
    bold: cfg?.bold_sandbox ? 'demo' : 'prod',
  }

  return (
    <form ref={formRef} onSubmit={handleSave} className="space-y-6">

      {/* Resumen de la pasarela activa */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-brand text-sm text-brand-primary/70">
          Pasarela activa: <strong className="text-brand-primary">{PROVIDER_LABEL[activeProvider]}</strong>
        </p>
        {activeProvider !== 'none' && <EnvBadge env={envOf[activeProvider]} />}
        <span className="font-brand text-xs text-brand-primary/40">· solo una puede estar activa a la vez</span>
      </div>

      {/* ── Menú horizontal (tabs) ─────────────────────────────────── */}
      <div className="border-b border-brand-primary/10 -mx-1">
        <div className="flex gap-1 overflow-x-auto px-1 pb-px">
          {TABS.map((t) => {
            const isView = tab === t.value
            const isActive = activeProvider === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`shrink-0 whitespace-nowrap px-4 py-2.5 font-brand text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isView
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-primary/50 hover:text-brand-primary'
                }`}
              >
                {t.label}
                {isActive && <span className="ml-1.5 text-green-600" title="Pasarela activa">●</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contenido del tab (todos montados; se oculta el inactivo) ── */}

      {/* Wompi */}
      <div className={tab === 'wompi' ? 'space-y-4' : 'hidden'}>
        <div className="flex items-center gap-2">
          <p className="font-brand text-xs text-brand-primary/40 flex-1">Tarjeta débito/crédito, PSE, Bancolombia Button</p>
          <EnvBadge env={envOf.wompi} />
        </div>
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Llave pública (pub_…)</label>
          <input type="text" name="wompi_public_key" defaultValue={cfg?.wompi_public_key ?? ''} placeholder="pub_test_… o pub_prod_…"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
          <p className="font-brand text-xs text-brand-primary/40 mt-1">Visible en el frontend. Empieza con pub_test_ (sandbox) o pub_prod_ (producción).</p>
        </div>
        <SecretInput label="Llave privada (prv_…)" name="wompi_private_key" hasExisting={cfg?.has_wompi_private_key ?? false} placeholder="prv_test_… o prv_prod_…" hint="Usada internamente. Nunca se expone al cliente." />
        <SecretInput label="Llave de integridad" name="wompi_integrity_secret" hasExisting={cfg?.has_wompi_integrity_secret ?? false} placeholder="test_integrity_… o prod_integrity_…" hint="Firma SHA256 de los payment links. Panel Wompi → Desarrolladores → Integridad." />
        <SecretInput label="Llave de eventos (webhooks)" name="wompi_events_secret" hasExisting={cfg?.has_wompi_events_secret ?? false} placeholder="test_events_… o prod_events_…" hint="Verifica que el webhook venga de Wompi. Panel Wompi → Webhooks." />
        <WebhookUrl provider="wompi" note="Pégala en Wompi → Desarrolladores → Eventos/Webhook." />
        <ActivateRow provider="wompi" />
      </div>

      {/* MercadoPago */}
      <div className={tab === 'mercadopago' ? 'space-y-4' : 'hidden'}>
        <div className="flex items-center gap-2">
          <p className="font-brand text-xs text-brand-primary/40 flex-1">Tarjeta, efectivo, Nequi, Daviplata</p>
          <EnvBadge env={envOf.mercadopago} />
        </div>
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Public Key (APP_USR-… o TEST-…)</label>
          <input type="text" name="mercadopago_public_key" defaultValue={cfg?.mercadopago_public_key ?? ''} placeholder="TEST-abc123… o APP_USR-abc123…"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
          <p className="font-brand text-xs text-brand-primary/40 mt-1">Usada en el frontend (checkout Brick). Panel MP → Credenciales.</p>
        </div>
        <SecretInput label="Access Token (TEST-… o APP_USR-…)" name="mercadopago_access_token" hasExisting={cfg?.has_mercadopago_access_token ?? false} placeholder="TEST-abc123… o APP_USR-abc123…" hint="Credencial privada de servidor. TEST-… = sandbox, APP_USR-… = producción." />
        <WebhookUrl provider="mercadopago" note="Pégala en MercadoPago → Tus integraciones → Webhooks (notificaciones)." />
        <ActivateRow provider="mercadopago" />
      </div>

      {/* Tu Compra — API REST (token JWT) */}
      <div className={tab === 'tucompra' ? 'space-y-4' : 'hidden'}>
        <div className="flex items-center gap-2">
          <p className="font-brand text-xs text-brand-primary/40 flex-1">Pasarela colombiana (API REST) — tarjeta, efectivo, Nequi, PSE</p>
          <EnvBadge env={envOf.tucompra} />
        </div>
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Usuario</label>
          <input type="text" name="tucompra_user" defaultValue={cfg?.tucompra_user ?? ''} placeholder="Usuario de autenticación"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
        </div>
        <SecretInput label="Contraseña (clave)" name="tucompra_password" hasExisting={cfg?.has_tucompra_password ?? false} placeholder="Clave de autenticación" hint="Credencial privada de servidor. Nunca se expone al cliente." />
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Terminal (Id Sistema)</label>
          <input type="text" name="tucompra_terminal" defaultValue={cfg?.tucompra_terminal ?? ''} placeholder="Terminal / Id Sistema"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
        </div>
        <SecretInput label="Llave pública (opcional)" name="tucompra_public_key" hasExisting={cfg?.has_tucompra_public_key ?? false} placeholder="Llave pública RSA" hint="Solo para pago de tarjeta directo (Cifrado de Valores). No se usa en el flujo de checkout redirect." />

        {/* Entorno + medios de pago (visual) → hidden tucompra_api_url / tucompra_methods_json */}
        <TuCompraMethods
          initial={Array.isArray(cfg?.tucompra_methods) ? (cfg?.tucompra_methods as Array<{ tipo: string; id?: string; enabled?: boolean }>) : []}
          initialEnv={tucompraEnv(cfg?.tucompra_api_url)}
        />

        <div className="mt-3 pt-3 border-t border-brand-primary/10">
          <p className="font-brand text-xs font-semibold text-brand-primary/70 mb-1">URLs para configurar en tu panel de Tu Compra</p>
          <CopyableUrl
            label="URL de Confirmación (server-to-server)"
            path="/api/webhooks/tucompra"
            note="Pégala en el panel Tu Compra → URL de Confirmación. En «sonda de confirmación» habilita al menos «Numero Factura» (correlaciona el pedido) y «Firma TuCompra»."
          />
          <CopyableUrl
            label="URL de Retorno (navegador)"
            path="/checkout/confirmation"
            note="A donde vuelve el cliente tras pagar. Pégala en el panel Tu Compra → URL de Retorno."
          />
        </div>

        <ActivateRow provider="tucompra" />
      </div>

      {/* Bold */}
      <div className={tab === 'bold' ? 'space-y-4' : 'hidden'}>
        <div className="flex items-center gap-2">
          <p className="font-brand text-xs text-brand-primary/40 flex-1">Tarjeta, PSE, Nequi, Botón Bancolombia — link de pagos</p>
          <EnvBadge env={envOf.bold} />
        </div>
        <SecretInput label="Llave de identidad (API key)" name="bold_api_key" hasExisting={!!cfg?.bold_api_key} placeholder="Llave de identidad Bold" hint="Se envía como Authorization: x-api-key al crear links. Panel Bold → Integraciones → Llaves." />
        <SecretInput label="Llave secreta (webhook)" name="bold_secret_key" hasExisting={cfg?.has_bold_secret_key ?? false} placeholder="Llave secreta Bold" hint="Verifica la firma HMAC-SHA256 del webhook (x-bold-signature). En sandbox va vacía." />
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" name="bold_sandbox" defaultChecked={cfg?.bold_sandbox ?? true} className="sr-only peer" />
            <div className="w-10 h-5 bg-brand-primary/20 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
          <span className="font-brand text-sm text-brand-primary">Modo sandbox (pruebas)</span>
        </label>
        <WebhookUrl provider="bold" note="Regístrala en Bold → Panel de Comercios → Integraciones → Webhooks." />
        <ActivateRow provider="bold" />
      </div>

      {/* Pago manual */}
      <div className={tab === 'none' ? 'space-y-4' : 'hidden'}>
        <div className="rounded-xl bg-brand-yellow/15 border border-brand-yellow/30 p-4">
          <p className="font-brand text-sm font-semibold text-brand-primary mb-1">Pago manual (sin pasarela en línea)</p>
          <p className="font-brand text-xs text-brand-primary/60">
            Con esta opción no se cobra en línea: cada pedido se crea como <strong>pendiente de validación</strong> y el
            administrador confirma o rechaza el pago desde el detalle del pedido. Útil para transferencias o pago contra entrega.
          </p>
        </div>
        <ActivateRow provider="none" />
      </div>

      {/* ── Acciones y estado ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2 border-t border-brand-primary/10">
        <button
          type="submit"
          disabled={saving || activating !== null}
          className="bg-white border border-brand-primary/30 text-brand-primary rounded-full px-6 py-2.5 font-brand font-medium text-sm hover:border-brand-primary transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar credenciales'}
        </button>
        {msg && (
          <span className={`font-brand text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
        )}
      </div>
      <p className="font-brand text-xs text-brand-primary/40">
        "Guardar credenciales" persiste los datos sin cambiar la pasarela activa. Para cambiar cuál cobra, usa "Activar" dentro de cada pestaña.
      </p>
    </form>
  )
}
