'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResourceList, ResourceItem, ResourceAction, EnvBadge, StatusBadge, WizardModal, Icon, type WizardStep } from '@merkiai/ui'

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
  has_mercadopago_webhook_secret: boolean
  has_tucompra_password: boolean
  has_tucompra_public_key: boolean
  has_tucompra_encryption_key: boolean
  has_bold_secret_key: boolean
}

interface Props {
  initialConfig: PaymentConfigData | null
  /** URL pública de la tienda (dominio propio o subdominio) para las URLs de webhook. */
  storeBaseUrl?: string | null
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
  'mercadopago_access_token', 'mercadopago_public_key', 'mercadopago_webhook_secret',
  'tucompra_user', 'tucompra_password', 'tucompra_terminal', 'tucompra_api_url', 'tucompra_public_key', 'tucompra_encryption_key',
  'bold_api_key', 'bold_secret_key',
]

// Base pública donde viven los handlers de webhook (app web). Generalizada por env.
const WEBHOOK_BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

/** URL de webhook de una pasarela, copiable para registrarla en su cuenta. */
function WebhookUrl({ provider, note, base }: { provider: string; note?: string; base?: string | null }) {
  const effBase = (base || WEBHOOK_BASE || '').replace(/\/$/, '')
  const url = effBase
    ? `${effBase}/api/webhooks/${provider}`
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
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="font-brand text-[11px] text-brand-primary/40 mt-1">
        {!effBase && 'La URL real aparecerá cuando tu tienda tenga dominio/subdominio. '}
        {note}
      </p>
    </div>
  )
}

/** URL parametrizada copiable (para pegar en el panel de la pasarela). */
function CopyableUrl({ label, path, note, base }: { label: string; path: string; note?: string; base?: string | null }) {
  const effBase = (base || WEBHOOK_BASE || '').replace(/\/$/, '')
  const url = effBase ? `${effBase}${path}` : `https://tu-dominio.com${path}`
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
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="font-brand text-[11px] text-brand-primary/40 mt-1">
        {!effBase && 'La URL real aparecerá cuando tu tienda tenga dominio/subdominio. '}
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

/** Catálogo de medios de pago de Tu Compra (modalidad integrador).
 *  Tarjeta se excluye a propósito: su flujo exige cifrar los datos de tarjeta en
 *  el sitio (RSA), lo que rompe PCI SAQ A. */
const TC_METHODS: { tipo: string; label: string; icon: string; desc: string; pci?: boolean }[] = [
  { tipo: 'pse',          label: 'PSE',          icon: '🏦', desc: 'Débito bancario en línea (redirección al banco)' },
  { tipo: 'nequi',        label: 'Nequi',        icon: '📲', desc: 'Billetera móvil — notificación push al celular' },
  { tipo: 'daviplata',    label: 'Daviplata',    icon: '📱', desc: 'Billetera móvil Davivienda (confirmación por OTP)' },
  { tipo: 'referenciado', label: 'Referenciado', icon: '🧾', desc: 'Efectivo en corresponsales / bancos (comprobante)' },
]

/** IDs de método por entorno (difieren demo/prod — Tabla de Valores Tu Compra). */
const TC_IDS: Record<'demo' | 'prod', Record<string, string>> = {
  demo: { pse: '41', nequi: '72', daviplata: '71', referenciado: '45' },
  prod: { pse: '3',  nequi: '72', daviplata: '71', referenciado: '45' },
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
            : 'Cobros reales a los clientes. Verifica credenciales de producción.'}
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

const GATEWAYS: ActiveProvider[] = ['wompi', 'mercadopago', 'tucompra', 'bold']

export default function PaymentConfigForm({ initialConfig, storeBaseUrl }: Props) {
  const cfg = initialConfig
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const whBase = storeBaseUrl ?? null

  const activeProvider: ActiveProvider = cfg?.active_provider ?? 'none'
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [verifying, setVerifying] = useState<ActiveProvider | null>(null)
  // modal: alta/edición de un medio. provider null = aún eligiendo (modo alta).
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; provider: ActiveProvider | null } | null>(null)

  // ¿Qué pasarelas tienen credenciales guardadas (se muestran como tarjetas)?
  const isConfigured = (p: ActiveProvider): boolean => {
    switch (p) {
      case 'wompi':       return !!cfg?.wompi_public_key
      case 'mercadopago': return !!cfg?.mercadopago_public_key || !!cfg?.has_mercadopago_access_token
      case 'tucompra':    return !!cfg?.tucompra_user
      case 'bold':        return !!cfg?.bold_api_key
      default:            return false
    }
  }
  const configured = GATEWAYS.filter(isConfigured)
  const available = GATEWAYS.filter((p) => !isConfigured(p))

  const envOf: Record<ActiveProvider, Env> = {
    none: 'unknown',
    wompi: wompiEnv(cfg?.wompi_public_key),
    mercadopago: mpEnv(cfg?.mercadopago_public_key),
    tucompra: tucompraEnv(cfg?.tucompra_api_url),
    bold: cfg?.bold_sandbox ? 'demo' : 'prod',
  }

  function buildFields(fd: FormData): Record<string, unknown> {
    const payload: Record<string, unknown> = {}
    for (const field of STRING_FIELDS) {
      const val = fd.get(field)
      if (typeof val === 'string' && val.trim()) payload[field] = val.trim()
    }
    // Flags de sandbox: SOLO si su sección está montada (marcador oculto), para no
    // pisar la config de otra pasarela al editar una distinta.
    if (fd.get('_bold_present')) payload.bold_sandbox = fd.get('bold_sandbox') === 'on'
    if (fd.get('_tucompra_present')) payload.tucompra_sandbox = fd.get('tucompra_sandbox') === 'on'
    // Medios de Tu Compra: JSON editable [{tipo,id,enabled}]
    const tcm = fd.get('tucompra_methods_json')
    if (typeof tcm === 'string' && tcm.trim()) {
      try {
        const parsed = JSON.parse(tcm)
        if (Array.isArray(parsed)) payload.tucompra_methods = parsed
      } catch { /* JSON inválido → se ignora */ }
    }
    return payload
  }

  /** Campos a limpiar (null) al Quitar un medio de pago. */
  function clearPayload(p: ActiveProvider): Record<string, unknown> {
    switch (p) {
      case 'wompi':       return { wompi_public_key: null, wompi_private_key: null, wompi_integrity_secret: null, wompi_events_secret: null }
      case 'mercadopago': return { mercadopago_public_key: null, mercadopago_access_token: null, mercadopago_webhook_secret: null }
      case 'tucompra':    return { tucompra_user: null, tucompra_password: null, tucompra_terminal: null, tucompra_api_url: null, tucompra_public_key: null, tucompra_encryption_key: null, tucompra_methods: [] }
      case 'bold':        return { bold_api_key: null, bold_secret_key: null }
      default:            return {}
    }
  }

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch('/api/admin/payment-config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const missing = Array.isArray(data.missing) && data.missing.length ? ` (faltan: ${data.missing.join(', ')})` : ''
      throw new Error(`${data.error ?? 'Error'}${missing}`)
    }
    return res.json()
  }

  async function run(fn: () => Promise<void>, okText?: string) {
    setBusy(true); setMsg(null)
    try {
      await fn()
      if (okText) setMsg({ type: 'ok', text: okText })
      router.refresh()
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' })
    } finally {
      setBusy(false)
    }
  }

  // Guardar (alta/edición) del medio del modal.
  async function saveModal() {
    if (!formRef.current || !modal?.provider) return
    const prov = modal.provider
    await run(async () => {
      await patch(buildFields(new FormData(formRef.current!)))
      setModal(null)
    }, `${PROVIDER_LABEL[prov]} guardado`)
  }

  const activate = (p: ActiveProvider) =>
    run(async () => { await patch({ active_provider: p }) },
      p === 'none' ? 'Pago manual activado' : `${PROVIDER_LABEL[p]} es ahora la pasarela activa`)

  const remove = (p: ActiveProvider) => {
    if (typeof window !== 'undefined' && !window.confirm(`¿Quitar ${PROVIDER_LABEL[p]}? Se borrarán sus credenciales de esta tienda.`)) return
    run(async () => {
      const payload = clearPayload(p)
      if (activeProvider === p) payload.active_provider = 'none'
      await patch(payload)
    }, `${PROVIDER_LABEL[p]} eliminado`)
  }

  // Verificación de credenciales (HU-273): ping ligero a la pasarela.
  async function verify(p: ActiveProvider) {
    setVerifying(p); setMsg(null)
    try {
      const res = await fetch('/api/admin/payment-config/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: p }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) setMsg({ type: 'ok', text: `${PROVIDER_LABEL[p]}: credenciales válidas ✓` })
      else if (data.supported === false) setMsg({ type: 'ok', text: `${PROVIDER_LABEL[p]}: verificación automática no disponible; se validará en el primer pago.` })
      else setMsg({ type: 'err', text: `${PROVIDER_LABEL[p]}: ${data.detail ?? 'no se pudieron validar las credenciales'}` })
    } catch {
      setMsg({ type: 'err', text: 'No se pudo verificar en este momento.' })
    } finally {
      setVerifying(null)
    }
  }

  // ── Campos de cada pasarela (se montan dentro del modal) ────────────────────
  function gatewayFields(p: ActiveProvider) {
    if (p === 'wompi') return (
      <div className="space-y-4">
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Llave pública (pub_…)</label>
          <input type="text" name="wompi_public_key" defaultValue={cfg?.wompi_public_key ?? ''} placeholder="pub_test_… o pub_prod_…"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
          <p className="font-brand text-xs text-brand-primary/40 mt-1">Visible en el frontend. pub_test_ (pruebas) o pub_prod_ (producción).</p>
        </div>
        <SecretInput label="Llave privada (prv_…)" name="wompi_private_key" hasExisting={cfg?.has_wompi_private_key ?? false} placeholder="prv_test_… o prv_prod_…" hint="Usada internamente para la re-consulta. Nunca se expone al cliente." />
        <SecretInput label="Llave de integridad" name="wompi_integrity_secret" hasExisting={cfg?.has_wompi_integrity_secret ?? false} placeholder="test_integrity_… o prod_integrity_…" hint="Firma SHA256 del checkout. Panel Wompi → Desarrolladores → Integridad. (No la confundas con la de eventos)." />
        <SecretInput label="Llave de eventos (webhooks)" name="wompi_events_secret" hasExisting={cfg?.has_wompi_events_secret ?? false} placeholder="test_events_… o prod_events_…" hint="Verifica que el webhook venga de Wompi. Panel Wompi → Webhooks." />
        <WebhookUrl provider="wompi" base={whBase} note="Pégala en Wompi → Desarrolladores → Eventos/Webhook." />
      </div>
    )
    if (p === 'mercadopago') return (
      <div className="space-y-4">
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Public Key (APP_USR-… o TEST-…)</label>
          <input type="text" name="mercadopago_public_key" defaultValue={cfg?.mercadopago_public_key ?? ''} placeholder="TEST-abc123… o APP_USR-abc123…"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
          <p className="font-brand text-xs text-brand-primary/40 mt-1">Usada en el checkout (Brick). Panel MP → Credenciales.</p>
        </div>
        <SecretInput label="Access Token (TEST-… o APP_USR-…)" name="mercadopago_access_token" hasExisting={cfg?.has_mercadopago_access_token ?? false} placeholder="TEST-abc123… o APP_USR-abc123…" hint="Credencial privada de servidor. TEST-… = pruebas, APP_USR-… = producción." />
        <SecretInput label="Clave secreta del webhook (x-signature)" name="mercadopago_webhook_secret" hasExisting={cfg?.has_mercadopago_webhook_secret ?? false} placeholder="Clave secreta de la firma" hint="Verifica la firma x-signature. Panel MP → Webhooks. Opcional (el estado se re-consulta a la API)." />
        <WebhookUrl provider="mercadopago" base={whBase} note="Pégala en MercadoPago → Tus integraciones → Webhooks." />
      </div>
    )
    if (p === 'tucompra') return (
      <div className="space-y-4">
        <input type="hidden" name="_tucompra_present" value="1" readOnly />
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Usuario</label>
          <input type="text" name="tucompra_user" defaultValue={cfg?.tucompra_user ?? ''} placeholder="Usuario de autenticación"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
        </div>
        <SecretInput label="Contraseña (clave)" name="tucompra_password" hasExisting={cfg?.has_tucompra_password ?? false} placeholder="Clave de autenticación" hint="Credencial privada de servidor." />
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Terminal (Id Sistema)</label>
          <input type="text" name="tucompra_terminal" defaultValue={cfg?.tucompra_terminal ?? ''} placeholder="Terminal / Id Sistema"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
        </div>
        <SecretInput label="Llave de encriptación (firma)" name="tucompra_encryption_key" hasExisting={cfg?.has_tucompra_encryption_key ?? false} placeholder="Llave de encriptación (MD5)" hint="Verifica la firma de la URL de Confirmación. Habilita «Firma TuCompra» en la sonda del panel." />
        <TuCompraMethods
          initial={Array.isArray(cfg?.tucompra_methods) ? (cfg?.tucompra_methods as Array<{ tipo: string; id?: string; enabled?: boolean }>) : []}
          initialEnv={tucompraEnv(cfg?.tucompra_api_url)}
        />
        <div className="mt-3 pt-3 border-t border-brand-primary/10">
          <p className="font-brand text-xs font-semibold text-brand-primary/70 mb-1">URLs para tu panel de Tu Compra</p>
          <CopyableUrl label="URL de Confirmación (server-to-server)" path="/api/webhooks/tucompra" base={whBase} note="Panel Tu Compra → URL de Confirmación. Habilita «Numero Factura» y «Firma TuCompra»." />
          <CopyableUrl label="URL de Retorno (navegador)" path="/checkout/confirmation" base={whBase} note="Panel Tu Compra → URL de Retorno." />
        </div>
      </div>
    )
    if (p === 'bold') return (
      <div className="space-y-4">
        <input type="hidden" name="_bold_present" value="1" readOnly />
        <SecretInput label="Llave de identidad (API key)" name="bold_api_key" hasExisting={!!cfg?.bold_api_key} placeholder="Llave de identidad Bold" hint="Se envía como x-api-key al crear links. Panel Bold → Integraciones → Llaves." />
        <SecretInput label="Llave secreta (webhook)" name="bold_secret_key" hasExisting={cfg?.has_bold_secret_key ?? false} placeholder="Llave secreta Bold" hint="Verifica la firma HMAC-SHA256 del webhook. En sandbox va vacía." />
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" name="bold_sandbox" defaultChecked={cfg?.bold_sandbox ?? true} className="sr-only peer" />
            <div className="w-10 h-5 bg-brand-primary/20 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
          <span className="font-brand text-sm text-brand-primary">Modo sandbox (pruebas)</span>
        </label>
        <WebhookUrl provider="bold" base={whBase} note="Regístrala en Bold → Integraciones → Webhooks." />
      </div>
    )
    return null
  }

  const descOf = (p: ActiveProvider) => TABS.find((t) => t.value === p)?.desc ?? ''

  // Pasos del modal: alta = [elegir, credenciales]; edición = [credenciales].
  const modalProvider = modal?.provider ?? null
  const steps: WizardStep[] = modal
    ? modal.mode === 'add'
      ? [
          {
            title: 'Elegir',
            canAdvance: modalProvider !== null,
            content: (
              <div>
                <p className="font-brand text-sm text-brand-primary/60 mb-3">¿Qué medio de pago quieres agregar?</p>
                {available.length === 0 ? (
                  <p className="font-brand text-sm text-brand-primary/50">Ya agregaste todas las pasarelas disponibles.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {available.map((p) => (
                      <button key={p} type="button" onClick={() => setModal({ mode: 'add', provider: p })}
                        className={`text-left rounded-xl border p-3 transition-colors ${modalProvider === p ? 'border-brand-primary ring-1 ring-brand-primary/20 bg-brand-cream/40' : 'border-brand-primary/15 hover:border-brand-primary/40'}`}>
                        <span className="font-brand text-sm font-semibold text-brand-primary">{PROVIDER_LABEL[p]}</span>
                        <p className="font-brand text-xs text-brand-primary/50 mt-0.5">{descOf(p)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            title: 'Credenciales',
            content: modalProvider ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display text-brand-primary text-base">{PROVIDER_LABEL[modalProvider]}</h3>
                  <EnvBadge env={envOf[modalProvider]} />
                </div>
                {gatewayFields(modalProvider)}
              </div>
            ) : <span />,
          },
        ]
      : [
          {
            title: 'Credenciales',
            content: modalProvider ? gatewayFields(modalProvider) : <span />,
          },
        ]
    : []

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
      <ResourceList
        title="Medios de pago"
        description="Agrega solo las pasarelas que vas a usar. Solo una puede estar activa (cobrando) a la vez; las demás quedan guardadas. Sin ninguna activa, los pedidos quedan en pago manual."
        addLabel="Agregar medio de pago"
        onAdd={() => setModal({ mode: 'add', provider: null })}
        addDisabled={busy || available.length === 0}
        isEmpty={configured.length === 0 && activeProvider !== 'none'}
        emptyIcon="money"
        emptyText="Aún no has agregado un medio de pago. Mientras tanto, cada pedido queda en pago manual."
      >
        {configured.map((p) => {
          const active = activeProvider === p
          return (
            <ResourceItem
              key={p}
              icon={<Icon name="money" size={18} />}
              title={PROVIDER_LABEL[p]}
              subtitle={descOf(p)}
              accent={active}
              badges={<>
                <EnvBadge env={envOf[p]} />
                {active && <StatusBadge tone="success">Activa</StatusBadge>}
              </>}
              actions={<>
                <ResourceAction icon="refresh" label={verifying === p ? 'Verificando…' : 'Verificar'} onClick={() => verify(p)} disabled={verifying !== null || busy} />
                <ResourceAction icon="edit" label="Editar" onClick={() => setModal({ mode: 'edit', provider: p })} disabled={busy} />
                {!active && <ResourceAction icon="check" label="Activar" tone="primary" onClick={() => activate(p)} disabled={busy} />}
                <ResourceAction icon="trash" label="Quitar" tone="danger" onClick={() => remove(p)} disabled={busy} />
              </>}
            />
          )
        })}

        {/* Pago manual: tarjeta informativa cuando es el modo activo */}
        {activeProvider === 'none' && (
          <ResourceItem
            icon={<Icon name="money" size={18} />}
            title="Pago manual"
            subtitle="Sin pago en línea. Cada pedido queda pendiente de validación del administrador."
            accent
            badges={<StatusBadge tone="info">Activo</StatusBadge>}
          />
        )}
      </ResourceList>

      {/* Activar pago manual (cuando hay una pasarela activa) */}
      {activeProvider !== 'none' && (
        <button type="button" onClick={() => activate('none')} disabled={busy}
          className="mt-4 font-brand text-xs text-brand-primary/50 hover:text-brand-primary underline disabled:opacity-40">
          Desactivar cobro en línea (usar pago manual)
        </button>
      )}

      {msg && (
        <p className={`mt-4 font-brand text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
      )}

      <WizardModal
        open={modal !== null}
        title={modal?.mode === 'edit' ? `Editar ${modal?.provider ? PROVIDER_LABEL[modal.provider] : ''}` : 'Agregar medio de pago'}
        steps={steps}
        onClose={() => setModal(null)}
        onFinish={saveModal}
        finishLabel="Guardar"
        busy={busy}
      />
    </form>
  )
}
