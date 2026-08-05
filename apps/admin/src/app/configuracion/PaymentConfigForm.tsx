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
  tucompra_merchant_id: string | null
  tucompra_sandbox: boolean
  bold_api_key: string | null
  bold_sandbox: boolean
  has_wompi_private_key: boolean
  has_wompi_integrity_secret: boolean
  has_wompi_events_secret: boolean
  has_mercadopago_access_token: boolean
  has_tucompra_secret_key: boolean
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
  'tucompra_merchant_id', 'tucompra_secret_key',
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

  function buildFields(fd: FormData): Record<string, string | boolean> {
    const payload: Record<string, string | boolean> = {
      tucompra_sandbox: fd.get('tucompra_sandbox') === 'on',
      bold_sandbox: fd.get('bold_sandbox') === 'on',
    }
    for (const field of STRING_FIELDS) {
      const val = fd.get(field)
      if (typeof val === 'string' && val.trim()) payload[field] = val.trim()
    }
    return payload
  }

  async function patch(payload: Record<string, string | boolean>) {
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

  return (
    <form ref={formRef} onSubmit={handleSave} className="space-y-6">

      {/* Resumen de la pasarela activa */}
      <p className="font-brand text-sm text-brand-primary/70">
        Pasarela activa: <strong className="text-brand-primary">{PROVIDER_LABEL[activeProvider]}</strong>
        <span className="text-brand-primary/40"> · solo una puede estar activa a la vez</span>
      </p>

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
        <p className="font-brand text-xs text-brand-primary/40">Tarjeta débito/crédito, PSE, Bancolombia Button</p>
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
        <p className="font-brand text-xs text-brand-primary/40">Tarjeta, efectivo, Nequi, Daviplata</p>
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

      {/* Tu Compra */}
      <div className={tab === 'tucompra' ? 'space-y-4' : 'hidden'}>
        <p className="font-brand text-xs text-brand-primary/40">Pasarela colombiana — tarjeta, efectivo, Nequi, PSE</p>
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Merchant ID</label>
          <input type="text" name="tucompra_merchant_id" defaultValue={cfg?.tucompra_merchant_id ?? ''} placeholder="Código de comercio Tu Compra"
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
        </div>
        <SecretInput label="Secret Key" name="tucompra_secret_key" hasExisting={cfg?.has_tucompra_secret_key ?? false} placeholder="Llave secreta Tu Compra" hint="Credencial privada de servidor. Nunca se expone al cliente." />
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" name="tucompra_sandbox" defaultChecked={cfg?.tucompra_sandbox ?? true} className="sr-only peer" />
            <div className="w-10 h-5 bg-brand-primary/20 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
          <span className="font-brand text-sm text-brand-primary">Modo sandbox (pruebas)</span>
        </label>
        <WebhookUrl provider="tucompra" note="Configúrala como URL de confirmación en tu cuenta Tu Compra." />
        <ActivateRow provider="tucompra" />
      </div>

      {/* Bold */}
      <div className={tab === 'bold' ? 'space-y-4' : 'hidden'}>
        <p className="font-brand text-xs text-brand-primary/40">Tarjeta, PSE, Nequi, Botón Bancolombia — link de pagos</p>
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
