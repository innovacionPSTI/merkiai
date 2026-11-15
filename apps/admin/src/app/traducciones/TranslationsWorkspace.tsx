'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveTranslationAction, importTranslationsAction } from './actions'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface Item {
  type: 'product' | 'category' | 'blog_post' | 'page' | 'section' | 'item'
  id: string
  label: string
  context?: string
  fields: string[]
  base: Record<string, string>
  translation: Record<string, string>
  done: number
  total: number
  status: 'complete' | 'partial' | 'missing'
}

interface Props {
  locale: string
  locales: { code: string; label: string }[]
  tab: string
  coverage: Array<{ key: string; label: string; items: number; complete: number; partial: number; missing: number; percent: number }>
  items: Item[]
  fieldLabels: Record<string, string>
  longFields: string[]
}

const input = 'w-full rounded-xl border border-brand-primary/20 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none'
const STATUS: Record<Item['status'], { label: string; cls: string }> = {
  complete: { label: 'Traducido', cls: 'bg-green-100 text-green-700' },
  partial: { label: 'Parcial', cls: 'bg-amber-100 text-amber-700' },
  missing: { label: 'Sin traducir', cls: 'bg-gray-100 text-gray-600' },
}

export default function TranslationsWorkspace({ locale, locales, tab, coverage, items, fieldLabels, longFields }: Props) {
  const tx = useTx()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Item | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const long = new Set(longFields)

  const go = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ idioma: locale, tipo: tab, ...params })
    setEditing(null)
    router.push(`/traducciones?${sp.toString()}`)
  }

  const visible = useMemo(() => items.filter((i) =>
    (filter === 'all' || i.status !== 'complete') &&
    (!query.trim() || `${i.label} ${i.context ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())),
  ), [items, filter, query])

  function open(item: Item) {
    setMsg(null)
    setEditing(item)
    setDraft({ ...item.translation })
  }

  function save() {
    if (!editing) return
    const item = editing
    start(async () => {
      const r = await saveTranslationAction(item.type, item.id, locale, draft)
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error })
      if (r.ok) { setEditing(null); router.refresh() }
    })
  }

  function importCsv(file: File) {
    start(async () => {
      const text = await file.text()
      const r = await importTranslationsAction(locale, text)
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error })
      if (r.ok) router.refresh()
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  return (
    <div className="space-y-5">
      {/* Idioma + CSV */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-wrap items-center gap-3">
        <label className="font-brand text-sm text-brand-primary"><T>Idioma</T>
          <select className={`${input} ml-2 w-auto inline-block`} value={locale} onChange={(e) => go({ idioma: e.target.value })}>
            {locales.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </label>
        <div className="flex-1" />
        <a href={`/api/admin/translations/export?locale=${encodeURIComponent(locale)}&type=${tab === 'blocks' ? 'blocks' : tab}`} className="rounded-full border border-brand-primary/30 px-4 py-2 font-brand text-sm text-brand-primary"><T>Exportar CSV</T></a>
        <a href={`/api/admin/translations/export?locale=${encodeURIComponent(locale)}&type=all`} className="rounded-full border border-brand-primary/30 px-4 py-2 font-brand text-sm text-brand-primary"><T>Exportar todo</T></a>
        <label className="rounded-full bg-brand-primary px-4 py-2 font-brand text-sm text-white cursor-pointer">
          {pending ? tx("Procesando…") : tx("Importar CSV")}
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" disabled={pending} onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f) }} />
        </label>
      </section>

      {/* Completitud por tipo (AC-2) */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {coverage.map((c) => (
          <button key={c.key} type="button" onClick={() => go({ tipo: c.key })}
            className={`rounded-2xl border p-4 text-left transition-colors ${tab === c.key ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 bg-white hover:border-brand-primary/40'}`}>
            <p className="font-brand text-sm font-semibold text-brand-primary">{c.label}</p>
            <p className="font-brand text-2xl text-brand-primary mt-1">{c.percent}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${c.percent}%` }} /></div>
            <p className="font-brand text-xs text-brand-primary/60 mt-2">{c.complete} de {c.items} <T>completos</T>{c.missing ? ` · ${c.missing} sin traducir` : ''}</p>
          </button>
        ))}
      </div>

      {msg && <p role="status" className={`font-brand text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Lista */}
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3">
            <input className={`${input} flex-1 min-w-[140px]`} placeholder={tx("Buscar")} value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className={`${input} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'pending')}>
              <option value="pending">Pendientes</option>
              <option value="all">Todos</option>
            </select>
          </div>
          {visible.length === 0 ? (
            <p className="p-6 font-brand text-sm text-brand-primary/60">{items.length === 0 ? tx("No hay contenido de este tipo.") : tx("Todo está traducido. ¡Bien!")}</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
              {visible.map((i) => (
                <li key={`${i.type}:${i.id}`}>
                  <button type="button" onClick={() => open(i)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${editing?.id === i.id && editing.type === i.type ? 'bg-brand-primary/5' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-brand text-sm text-brand-primary truncate">{i.label}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 font-brand text-[11px] ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span>
                    </div>
                    {i.context && <p className="font-brand text-xs text-brand-primary/50 truncate">{i.context}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Editor lado a lado (AC-1) */}
        <section className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-5">
          {!editing ? (
            <p className="font-brand text-sm text-brand-primary/60">Elige un elemento de la lista para traducirlo. A la izquierda verás el texto original; a la derecha, escribe la traducción.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-brand text-base font-semibold text-brand-primary">{editing.label}</h2>
                {editing.context && <p className="font-brand text-xs text-brand-primary/50">{editing.context}</p>}
              </div>
              {editing.fields.map((f) => (
                <div key={f} className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="font-brand text-xs font-semibold text-brand-primary/60 mb-1">{fieldLabels[f] ?? f} <T>· original</T></p>
                    <div className="rounded-xl bg-gray-50 px-3 py-2 font-brand text-sm text-brand-primary/80 whitespace-pre-wrap break-words min-h-[38px]">{editing.base[f] || '—'}</div>
                  </div>
                  <label className="block">
                    <span className="font-brand text-xs font-semibold text-brand-primary/60 mb-1 block">{fieldLabels[f] ?? f} · {locales.find((l) => l.code === locale)?.label ?? locale}</span>
                    {long.has(f) ? (
                      <textarea rows={f === 'content' ? 10 : 3} className={input} value={draft[f] ?? ''} onChange={(e) => setDraft({ ...draft, [f]: e.target.value })} />
                    ) : (
                      <input className={input} value={draft[f] ?? ''} onChange={(e) => setDraft({ ...draft, [f]: e.target.value })} placeholder={f === 'slug' ? 'enlace-en-este-idioma' : ''} />
                    )}
                  </label>
                </div>
              ))}
              <p className="font-brand text-xs text-brand-primary/50"><T>Deja un campo vacío para mostrar el texto original en ese idioma.</T></p>
              <div className="flex gap-3">
                <button type="button" disabled={pending} onClick={save} className="rounded-full bg-brand-primary px-6 py-2.5 font-brand text-sm text-white disabled:opacity-60">{pending ? tx("Guardando…") : tx("Guardar traducción")}</button>
                <button type="button" disabled={pending} onClick={() => setEditing(null)} className="rounded-full border border-brand-primary/30 px-6 py-2.5 font-brand text-sm text-brand-primary"><T>Cancelar</T></button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
