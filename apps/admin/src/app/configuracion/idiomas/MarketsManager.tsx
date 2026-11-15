'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@merkiai/ui'
import { saveMarketAction, deleteMarketAction } from './actions'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface MarketView {
  id: number
  key: string
  name: string
  countries: string[]
  currency: string
  price_list_id: number | null
  locales: string[]
  default_locale: string
  domain: string | null
  is_default: boolean
  active: boolean
  virtual?: boolean
}

interface Props {
  markets: MarketView[]
  locales: { code: string; label: string }[]
  priceLists: { id: number; name: string }[]
  rules: { maxLanguages: number | null; marketsEnabled: boolean; multiCurrency: boolean }
  usedLanguages: number
}

const input = 'rounded-xl border border-brand-primary/20 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none'

type Draft = Omit<MarketView, 'countries'> & { countriesText: string }

function toDraft(m: MarketView): Draft {
  const { countries, ...rest } = m
  return { ...rest, countriesText: countries.join(', ') }
}

export default function MarketsManager({ markets, locales, priceLists, rules, usedLanguages }: Props) {
  const tx = useTx()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState<Draft | null>(null)
  const [toDelete, setToDelete] = useState<MarketView | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; list?: string[] } | null>(null)
  const baseCurrency = (markets.find((m) => m.is_default) ?? markets[0])?.currency ?? 'COP'
  const label = (code: string) => locales.find((l) => l.code === code)?.label ?? code
  const canAddMarket = rules.marketsEnabled

  const newDraft = (): Draft => ({
    id: 0, key: '', name: '', countriesText: '', currency: baseCurrency, price_list_id: null,
    locales: [markets[0]?.default_locale ?? 'es-CO'], default_locale: markets[0]?.default_locale ?? 'es-CO',
    domain: null, is_default: false, active: true,
  })

  const limitText = useMemo(() => {
    if (rules.maxLanguages === null) return tx("Usas {usedLanguages} idioma(s). Tu plan no tiene límite de idiomas.", { usedLanguages })
    return tx("Usas {usedLanguages} de {maxLanguages} idioma(s) incluidos en tu plan.", { usedLanguages, maxLanguages: rules.maxLanguages })
  }, [rules.maxLanguages, usedLanguages])

  function toggleLocale(code: string) {
    if (!editing) return
    const has = editing.locales.includes(code)
    const next = has ? editing.locales.filter((l) => l !== code) : [...editing.locales, code]
    const default_locale = next.includes(editing.default_locale) ? editing.default_locale : (next[0] ?? '')
    setEditing({ ...editing, locales: next, default_locale })
  }

  function save() {
    if (!editing) return
    const d = editing
    start(async () => {
      const r = await saveMarketAction({
        id: d.virtual ? 0 : (d.id || null),
        key: d.key || null,
        name: d.name,
        countries: d.countriesText.split(/[\s,;]+/).filter(Boolean),
        currency: d.currency,
        price_list_id: d.price_list_id,
        locales: d.locales,
        default_locale: d.default_locale,
        domain: d.domain,
        is_default: d.is_default,
        active: d.active,
      })
      if (r.ok) { setMsg({ ok: true, text: r.message }); setEditing(null); router.refresh() }
      else setMsg({ ok: false, text: r.error, list: r.errors && r.errors.length > 1 ? r.errors : undefined })
    })
  }

  function remove(m: MarketView) {
    setToDelete(null)
    start(async () => {
      const r = await deleteMarketAction(m.id)
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error })
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-brand text-sm text-brand-primary">{limitText}</p>
          <p className="font-brand text-xs text-brand-primary/60 mt-1">
            Cada variante regional cuenta como un idioma (por ejemplo, Español de Colombia y Español de México son 2).
            Por ahora la tienda se sigue mostrando en el idioma por defecto; las versiones en otros idiomas se publican en una próxima actualización.
          </p>
        </div>
        <button
          type="button"
          disabled={!canAddMarket || pending}
          title={canAddMarket ? undefined : tx("Tu plan incluye un solo mercado")}
          onClick={() => { setMsg(null); setEditing(newDraft()) }}
          className="rounded-full bg-brand-primary px-5 py-2 font-brand text-sm text-white disabled:opacity-50"
        >
          <T>Agregar mercado</T>
        </button>
      </section>
      {!canAddMarket && (
        <p className="font-brand text-xs text-brand-primary/60 -mt-2"><T>Tu plan incluye un solo mercado. Para vender en varios países con su propia configuración, mejora tu plan desde</T> <a href="/facturacion" className="underline"><T>Plan y facturación</T></a>.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {markets.map((m) => (
          <article key={m.virtual ? 'virtual' : m.id} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-brand text-base font-semibold text-brand-primary">{m.name}</h2>
                <p className="font-brand text-xs text-brand-primary/60">{m.countries.length ? m.countries.join(', ') : tx("Sin países")} · {m.currency}</p>
              </div>
              <div className="flex gap-1">
                {m.is_default && <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 font-brand text-xs text-brand-primary"><T>Predeterminado</T></span>}
                {!m.active && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-brand text-xs text-gray-600"><T>Inactivo</T></span>}
              </div>
            </div>
            <ul className="font-brand text-sm text-brand-primary space-y-0.5">
              {m.locales.map((l) => (
                <li key={l}>{label(l)}{l === m.default_locale ? ' · por defecto' : ''}</li>
              ))}
            </ul>
            {m.domain && <p className="font-brand text-xs text-brand-primary/60"><T>Dominio:</T> {m.domain}</p>}
            {m.price_list_id && <p className="font-brand text-xs text-brand-primary/60"><T>Lista de precios:</T> {priceLists.find((p) => p.id === m.price_list_id)?.name ?? '—'}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" className="font-brand text-sm text-brand-primary underline" onClick={() => { setMsg(null); setEditing(toDraft(m)) }}><T>Editar</T></button>
              {!m.is_default && !m.virtual && (
                <button type="button" className="font-brand text-sm text-red-600 underline" disabled={pending} onClick={() => setToDelete(m)}><T>Eliminar</T></button>
              )}
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <section className="rounded-2xl border border-brand-primary/30 bg-white p-5 space-y-4" aria-label={tx("Editar mercado")}>
          <h2 className="font-brand text-sm font-semibold text-brand-primary">{editing.id || editing.virtual ? tx("Editar {name}", { name: editing.name || tx('mercado') }) : tx("Nuevo mercado")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block font-brand text-sm text-brand-primary"><T>Nombre</T>
              <input className={`${input} mt-1 w-full`} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder={tx("México")} />
            </label>
            <label className="block font-brand text-sm text-brand-primary"><T>Países (código de 2 letras)</T>
              <input className={`${input} mt-1 w-full`} value={editing.countriesText} onChange={(e) => setEditing({ ...editing, countriesText: e.target.value })} placeholder="MX" />
            </label>
            <label className="block font-brand text-sm text-brand-primary"><T>Moneda</T>
              <input className={`${input} mt-1 w-full bg-gray-50`} value={editing.currency} disabled={!rules.multiCurrency} onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })} />
              {!rules.multiCurrency && <span className="block font-brand text-xs text-brand-primary/60 mt-1"><T>Por ahora todos los mercados venden en la moneda de la tienda (</T>{baseCurrency}). Los precios en otra moneda llegan en una próxima versión.</span>}
            </label>
            <label className="block font-brand text-sm text-brand-primary"><T>Dominio propio (opcional)</T>
              <input className={`${input} mt-1 w-full`} value={editing.domain ?? ''} onChange={(e) => setEditing({ ...editing, domain: e.target.value || null })} placeholder="mitienda.mx" />
            </label>
            {priceLists.length > 0 && (
              <label className="block font-brand text-sm text-brand-primary"><T>Lista de precios (opcional)</T>
                <select className={`${input} mt-1 w-full`} value={editing.price_list_id ?? ''} onChange={(e) => setEditing({ ...editing, price_list_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">Precio general de la tienda</option>
                  {priceLists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="font-brand text-sm text-brand-primary"><T>Idiomas del mercado</T></legend>
            <div className="flex flex-wrap gap-3">
              {locales.map((l) => (
                <label key={l.code} className="flex items-center gap-2 font-brand text-sm text-brand-primary">
                  <input type="checkbox" checked={editing.locales.includes(l.code)} onChange={() => toggleLocale(l.code)} /> {l.label}
                </label>
              ))}
            </div>
            <label className="block font-brand text-sm text-brand-primary"><T>Idioma por defecto del mercado</T>
              <select className={`${input} mt-1`} value={editing.default_locale} onChange={(e) => setEditing({ ...editing, default_locale: e.target.value })}>
                {editing.locales.map((l) => <option key={l} value={l}>{label(l)}</option>)}
              </select>
            </label>
          </fieldset>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
              <input type="checkbox" checked={editing.is_default} disabled={markets.length <= 1 && editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} /> <T>Mercado predeterminado de la tienda</T>
            </label>
            <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
              <input type="checkbox" checked={editing.active} disabled={editing.is_default} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> <T>Activo</T>
            </label>
          </div>

          <div className="flex gap-3">
            <button type="button" disabled={pending} onClick={save} className="rounded-full bg-brand-primary px-6 py-2.5 font-brand text-sm text-white disabled:opacity-60">{pending ? tx("Guardando…") : tx("Guardar mercado")}</button>
            <button type="button" disabled={pending} onClick={() => setEditing(null)} className="rounded-full border border-brand-primary/30 px-6 py-2.5 font-brand text-sm text-brand-primary"><T>Cancelar</T></button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={tx("Eliminar mercado")}
        message={toDelete ? tx("¿Eliminar el mercado \"{toDeleteName}\"? Esta acción no se puede deshacer.", { toDeleteName: toDelete.name }) : ''}
        danger confirmLabel="Eliminar" busy={pending}
        onConfirm={() => { if (toDelete) remove(toDelete) }}
        onCancel={() => setToDelete(null)}
      />

      {msg && (
        <div role="status" className={`font-brand text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
          <p>{msg.text}</p>
          {msg.list && <ul className="list-disc pl-5 mt-1">{msg.list.slice(1).map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      )}
    </div>
  )
}
