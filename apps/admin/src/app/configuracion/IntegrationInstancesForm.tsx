'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResourceList, ResourceItem, ResourceAction, EnvBadge, StatusBadge, WizardModal, Icon, type WizardStep } from '@merkiai/ui'
import type { MaskedInstance, PublicProviderDef } from '@/lib/mask-instance'

interface Props {
  kind: 'payment' | 'shipping' | 'email'
  apiBase: string
  addLabel: string
  emptyText: string
  instances: MaskedInstance[]
  providers: PublicProviderDef[]
  storeBaseUrl?: string | null
  /** Mostrar el toggle de entorno (pagos/envíos sí; correo no). */
  showEnv?: boolean
  /** Mostrar la URL de webhook (solo pagos). */
  showWebhook?: boolean
  /** Método incorporado (sin credenciales) que se lista junto a las instancias. Ej. "Tarifa fija" en envíos. */
  builtin?: BuiltinMethod
  /** Hook tras activar/desactivar una instancia (ej. fijar shipping_config.provider). */
  onAfterActivate?: (id: string | null) => Promise<void>
}

export interface BuiltinMethod {
  title: string
  subtitle: string
  /** true cuando el método incorporado es el ACTIVO (ningún carrier lo está). */
  active: boolean
  badgeText?: string
  onActivate: () => void
  onEdit?: () => void
}

type Env = 'test' | 'production'

// ── Tu Compra: catálogo de medios + URLs/IDs por entorno (settings) ──────────
const TC_URLS = { test: 'https://ws.tucompra.net/tcWSDRest/api', production: 'https://ws2.tucompra.com.co/tcWSDRest/api' }
const TC_METHODS = [
  { tipo: 'pse',          label: 'PSE',          desc: 'Débito bancario (redirección al banco)' },
  { tipo: 'nequi',        label: 'Nequi',        desc: 'Billetera móvil (push al celular)' },
  { tipo: 'daviplata',    label: 'Daviplata',    desc: 'Billetera Davivienda (OTP)' },
  { tipo: 'referenciado', label: 'Referenciado', desc: 'Efectivo en corresponsales (comprobante)' },
]
const TC_IDS: Record<Env, Record<string, string>> = {
  test:       { pse: '41', nequi: '72', daviplata: '71', referenciado: '45' },
  production: { pse: '3',  nequi: '72', daviplata: '71', referenciado: '45' },
}

type TcMethod = { tipo: string; id: string; enabled: boolean }

interface Draft {
  mode: 'add' | 'edit'
  provider: string
  instanceId?: string
  label: string
  environment: Env
  creds: Record<string, string>
  secretSet: Record<string, boolean>
  tcMethods: TcMethod[]
  boldSandbox: boolean
}

/** Genera un secreto aleatorio de 256 bits (base64url, sin espacios) con Web Crypto. */
function generateSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `whsec_${b64}`
}

function SecretField({ label, hint, hasExisting, value, onChange, generatable = false }: {
  label: string; hint?: string; hasExisting: boolean; value: string; onChange: (v: string) => void; generatable?: boolean
}) {
  const [changing, setChanging] = useState(!hasExisting)
  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState(false)
  const editing = !hasExisting || changing

  function copy() {
    if (!value) return
    navigator.clipboard?.writeText(value)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">{label}</label>
      {!editing ? (
        <div className="flex items-center gap-3">
          <span className="flex-1 border border-brand-primary/10 rounded-xl px-4 py-2.5 font-mono text-sm text-brand-primary/40 bg-gray-50">••••••••••••</span>
          <button type="button" onClick={() => setChanging(true)} className="font-brand text-xs text-brand-primary underline hover:text-brand-dark">Cambiar</button>
        </div>
      ) : (
        <>
          <input type={generatable && reveal ? 'text' : 'password'} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
          {generatable && (
            <div className="flex items-center gap-3 mt-1.5">
              <button type="button" onClick={() => { onChange(generateSecret()); setReveal(true) }}
                className="font-brand text-xs font-semibold text-brand-primary underline hover:text-brand-dark">Generar clave segura</button>
              {value && (
                <>
                  <button type="button" onClick={() => setReveal((r) => !r)} className="font-brand text-xs text-brand-primary/60 hover:text-brand-primary">{reveal ? 'Ocultar' : 'Ver'}</button>
                  <button type="button" onClick={copy} className="font-brand text-xs text-brand-primary/60 hover:text-brand-primary">{copied ? 'Copiada ✓' : 'Copiar'}</button>
                </>
              )}
            </div>
          )}
        </>
      )}
      {hint && <p className="font-brand text-xs text-brand-primary/40 mt-1">{hint}</p>}
      {generatable && editing && (
        <p className="font-brand text-xs text-amber-600/80 mt-1">Pega esta misma clave en Skydropx (método HMAC) y guárdala aquí. Debe coincidir exactamente.</p>
      )}
    </div>
  )
}

function WebhookUrl({ provider, base }: { provider: string; base?: string | null }) {
  const effBase = (base || '').replace(/\/$/, '')
  const url = effBase ? `${effBase}/api/webhooks/${provider}` : `https://tu-dominio.com/api/webhooks/${provider}`
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-xl border border-brand-primary/10 bg-brand-cream/30 p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-brand text-xs font-semibold text-brand-primary/70">URL de webhook</p>
        <p className="font-mono text-xs text-brand-primary/60 truncate">{url}</p>
      </div>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="shrink-0 font-brand text-xs text-brand-primary underline hover:text-brand-dark">{copied ? 'Copiada' : 'Copiar'}</button>
    </div>
  )
}

export default function IntegrationInstancesForm({ kind, apiBase, addLabel, emptyText, instances, providers, storeBaseUrl, showEnv = true, showWebhook = false, builtin, onAfterActivate }: Props) {
  const router = useRouter()
  const defaultEnv: Env = showEnv ? 'test' : 'production'
  const [busy, setBusy] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)

  const defOf = (p: string) => providers.find((d) => d.provider === p)
  const labelOf = (p: string) => defOf(p)?.label ?? p
  const descOf = (p: string) => defOf(p)?.description ?? ''
  const anyActive = instances.some((i) => i.isActive)

  async function api(path: string, method: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    const res = await fetch(`${apiBase}${path}`, {
      method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }

  async function run(fn: () => Promise<void>, okText?: string) {
    setBusy(true); setMsg(null)
    try { await fn(); if (okText) setMsg({ type: 'ok', text: okText }); router.refresh() }
    catch (err) { setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error' }) }
    finally { setBusy(false) }
  }

  // ── Draft helpers ───────────────────────────────────────────────────────────
  function newDraft(provider: string): Draft {
    return {
      mode: 'add', provider, label: '', environment: defaultEnv,
      creds: {}, secretSet: {},
      tcMethods: TC_METHODS.map((m) => ({ tipo: m.tipo, id: TC_IDS.test[m.tipo], enabled: false })),
      boldSandbox: true,
    }
  }
  function editDraft(inst: MaskedInstance): Draft {
    const tc = (Array.isArray(inst.settings.methods) ? inst.settings.methods : []) as TcMethod[]
    const tcMethods = TC_METHODS.map((m) => {
      const found = tc.find((x) => x.tipo === m.tipo)
      return { tipo: m.tipo, id: found?.id ?? TC_IDS[inst.environment][m.tipo], enabled: found?.enabled ?? false }
    })
    return {
      mode: 'edit', provider: inst.provider, instanceId: inst.id,
      label: inst.label ?? '', environment: inst.environment,
      creds: { ...inst.values }, secretSet: { ...inst.secretSet },
      tcMethods, boldSandbox: (inst.settings.sandbox as boolean | undefined) ?? (inst.environment === 'test'),
    }
  }

  function setCred(key: string, v: string) { setDraft((d) => d ? { ...d, creds: { ...d.creds, [key]: v } } : d) }
  function setEnv(env: Env) {
    setDraft((d) => d ? {
      ...d, environment: env,
      boldSandbox: env === 'test',
      tcMethods: d.tcMethods.map((m) => ({ ...m, id: TC_IDS[env][m.tipo] })),
    } : d)
  }

  function buildSettings(d: Draft): Record<string, unknown> {
    if (d.provider === 'tucompra') return { api_url: TC_URLS[d.environment], methods: d.tcMethods }
    if (d.provider === 'bold') return { sandbox: d.boldSandbox }
    return {}
  }

  async function save() {
    if (!draft) return
    const d = draft
    await run(async () => {
      const payload = { provider: d.provider, label: d.label || null, environment: d.environment, credentials: d.creds, settings: buildSettings(d) }
      const r = d.mode === 'add'
        ? await api('', 'POST', payload)
        : await api(`/${d.instanceId}`, 'PATCH', { label: payload.label, environment: d.environment, credentials: d.creds, settings: payload.settings })
      if (!r.ok) throw new Error((r.data.error as string) ?? 'No se pudo guardar')
      setDraft(null)
    }, `${labelOf(d.provider)} guardado`)
  }

  const activate = (id: string | null) => run(async () => {
    const r = await api('/activate', 'POST', { id })
    if (!r.ok) { const miss = Array.isArray(r.data.missing) ? ` (${(r.data.missing as string[]).join(', ')})` : ''; throw new Error(((r.data.error as string) ?? 'No se pudo activar') + miss) }
    await onAfterActivate?.(id)
  }, id ? 'Método activado' : 'Cobro en línea desactivado (pago manual)')

  // Un carrier es el método ACTIVO solo si está activo y el incorporado (tarifa fija) no lo está.
  const carrierIsActive = (inst: MaskedInstance) => inst.isActive && !(builtin?.active)

  const remove = (inst: MaskedInstance) => {
    if (typeof window !== 'undefined' && !window.confirm(`¿Quitar "${inst.label || labelOf(inst.provider)}"? Se borran sus credenciales.`)) return
    run(async () => { const r = await api(`/${inst.id}`, 'DELETE'); if (!r.ok) throw new Error((r.data.error as string) ?? 'No se pudo quitar') }, 'Medio de pago eliminado')
  }

  async function verify(inst: MaskedInstance) {
    setVerifying(inst.id); setMsg(null)
    try {
      const r = await api('/verify', 'POST', { id: inst.id })
      const d = r.data
      if (r.ok && d.ok) setMsg({ type: 'ok', text: `${labelOf(inst.provider)}: credenciales válidas ✓` })
      else if (d.supported === false) setMsg({ type: 'ok', text: `${labelOf(inst.provider)}: verificación automática no disponible; se valida en el primer pago.` })
      else setMsg({ type: 'err', text: `${labelOf(inst.provider)}: ${(d.detail as string) ?? 'no se pudieron validar las credenciales'}` })
    } catch { setMsg({ type: 'err', text: 'No se pudo verificar.' }) }
    finally { setVerifying(null) }
  }

  // ── Render de los campos del proveedor en el wizard ─────────────────────────
  function providerFields(d: Draft) {
    const def = defOf(d.provider)
    if (!def) return null
    return (
      <div className="space-y-4">
        {/* Entorno */}
        {showEnv && (
          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">Entorno</label>
            <div className="inline-flex rounded-xl border border-brand-primary/20 p-1 bg-brand-cream/40">
              {(['test', 'production'] as Env[]).map((e) => (
                <button key={e} type="button" onClick={() => setEnv(e)}
                  className={`px-4 py-1.5 rounded-lg font-brand text-sm font-medium transition-colors ${
                    d.environment === e ? (e === 'production' ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white') : 'text-brand-primary/60 hover:text-brand-primary'
                  }`}>{e === 'production' ? '● Producción' : '○ Pruebas'}</button>
              ))}
            </div>
          </div>
        )}

        {/* Etiqueta interna */}
        <div>
          <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">Etiqueta (interna)</label>
          <input type="text" value={d.label} onChange={(e) => setDraft((x) => x ? { ...x, label: e.target.value } : x)}
            placeholder={`Ej. ${def.label} ${d.environment === 'production' ? 'producción' : 'pruebas'}`}
            className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary" />
          <p className="font-brand text-xs text-brand-primary/40 mt-1">Solo para distinguir tus configuraciones; el cliente no la ve.</p>
        </div>

        {/* Campos del registry */}
        {def.fields.map((f) => f.type === 'secret' ? (
          <SecretField key={f.key} label={f.label} hint={f.hint} hasExisting={d.secretSet[f.key] ?? false}
            value={d.creds[f.key] ?? ''} onChange={(v) => setCred(f.key, v)} generatable={f.key === 'webhook_secret'} />
        ) : (
          <div key={f.key}>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">{f.label}</label>
            <input type="text" value={d.creds[f.key] ?? ''} onChange={(e) => setCred(f.key, e.target.value)} placeholder={f.placeholder}
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary" />
            {f.hint && <p className="font-brand text-xs text-brand-primary/40 mt-1">{f.hint}</p>}
          </div>
        ))}

        {/* Tu Compra: medios de pago */}
        {d.provider === 'tucompra' && (
          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">Medios de pago habilitados</label>
            <div className="space-y-2">
              {d.tcMethods.map((m, i) => {
                const meta = TC_METHODS.find((x) => x.tipo === m.tipo)!
                return (
                  <div key={m.tipo} className="flex items-center gap-3 rounded-xl border border-brand-primary/15 px-3 py-2.5 bg-white">
                    <button type="button" role="switch" aria-checked={m.enabled}
                      onClick={() => setDraft((x) => x ? { ...x, tcMethods: x.tcMethods.map((y, j) => j === i ? { ...y, enabled: !y.enabled } : y) } : x)}
                      className={`relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors ${m.enabled ? 'bg-green-500' : 'bg-brand-primary/20'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${m.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="font-brand text-sm font-semibold text-brand-primary">{meta.label}</span>
                      <p className="font-brand text-[11px] text-brand-primary/40 truncate">{meta.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showWebhook && <WebhookUrl provider={d.provider} base={storeBaseUrl} />}
      </div>
    )
  }

  // ── Pasos del wizard ─────────────────────────────────────────────────────────
  const steps: WizardStep[] = draft
    ? draft.mode === 'add'
        ? [
            { title: 'Pasarela', canAdvance: !!draft.provider, content: (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {providers.map((p) => (
                  <button key={p.provider} type="button" onClick={() => setDraft(newDraft(p.provider))}
                    className={`text-left rounded-xl border p-3 transition-colors ${draft.provider === p.provider ? 'border-brand-primary ring-1 ring-brand-primary/20 bg-brand-cream/40' : 'border-brand-primary/15 hover:border-brand-primary/40'}`}>
                    <span className="font-brand text-sm font-semibold text-brand-primary">{p.label}</span>
                    <p className="font-brand text-xs text-brand-primary/50 mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
            ) },
            { title: 'Credenciales', content: providerFields(draft) },
          ]
        : [{ title: 'Credenciales', content: providerFields(draft) }]
    : []

  return (
    <div>
      <ResourceList
        addLabel={addLabel}
        onAdd={() => setDraft({ mode: 'add', provider: '', label: '', environment: defaultEnv, creds: {}, secretSet: {}, tcMethods: TC_METHODS.map((m) => ({ tipo: m.tipo, id: TC_IDS.test[m.tipo], enabled: false })), boldSandbox: true })}
        isEmpty={!builtin && instances.length === 0}
        emptyIcon={kind === 'shipping' ? 'truck' : kind === 'email' ? 'bell' : 'money'}
        emptyText={emptyText}
      >
        {builtin && (
          <ResourceItem
            key="__builtin"
            icon={<Icon name="money" size={18} />}
            title={builtin.title}
            subtitle={builtin.subtitle}
            accent={builtin.active}
            badges={<>
              {builtin.badgeText && <StatusBadge tone="neutral">{builtin.badgeText}</StatusBadge>}
              {builtin.active && <StatusBadge tone="success">Activo</StatusBadge>}
            </>}
            actions={<>
              {builtin.onEdit && <ResourceAction icon="edit" label="Editar" onClick={builtin.onEdit} disabled={busy} />}
              {!builtin.active && <ResourceAction icon="check" label="Activar" tone="primary" onClick={builtin.onActivate} disabled={busy} />}
            </>}
          />
        )}
        {instances.map((inst) => (
          <ResourceItem
            key={inst.id}
            icon={<Icon name={kind === 'shipping' ? 'truck' : kind === 'email' ? 'bell' : 'money'} size={18} />}
            title={inst.label || labelOf(inst.provider)}
            subtitle={descOf(inst.provider)}
            accent={carrierIsActive(inst)}
            badges={<>
              {showEnv && <EnvBadge env={inst.environment === 'production' ? 'prod' : 'demo'} />}
              {carrierIsActive(inst) && <StatusBadge tone="success">Activa</StatusBadge>}
            </>}
            actions={<>
              <ResourceAction icon="refresh" label={verifying === inst.id ? 'Verificando…' : 'Verificar'} onClick={() => verify(inst)} disabled={verifying !== null || busy} />
              <ResourceAction icon="edit" label="Editar" onClick={() => setDraft(editDraft(inst))} disabled={busy} />
              {!carrierIsActive(inst) && <ResourceAction icon="check" label="Activar" tone="primary" onClick={() => activate(inst.id)} disabled={busy} />}
              <ResourceAction icon="trash" label="Quitar" tone="danger" onClick={() => remove(inst)} disabled={busy} />
            </>}
          />
        ))}
      </ResourceList>

      {anyActive && kind === 'payment' && (
        <button type="button" onClick={() => activate(null)} disabled={busy}
          className="mt-4 font-brand text-xs text-brand-primary/50 hover:text-brand-primary underline disabled:opacity-40">
          Desactivar cobro en línea (usar pago manual)
        </button>
      )}

      {msg && <p className={`mt-4 font-brand text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}

      <WizardModal
        open={draft !== null}
        title={draft?.mode === 'edit' ? `Editar ${draft?.provider ? labelOf(draft.provider) : ''}` : addLabel}
        steps={steps}
        onClose={() => setDraft(null)}
        onFinish={save}
        finishLabel="Guardar"
        busy={busy}
      />
    </div>
  )
}
