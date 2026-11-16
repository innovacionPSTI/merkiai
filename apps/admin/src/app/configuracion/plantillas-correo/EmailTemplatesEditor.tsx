'use client'

import { useState } from 'react'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface Tpl { type: string; label: string; vars: string[]; subject: string; body: string; enabled: boolean; customized: boolean }

const LANGUAGE_LABEL: Record<string, string> = { es: 'Español', en: 'English' }

export default function EmailTemplatesEditor({ initial, languages = ['es'], initialLanguage = 'es' }: { initial: Tpl[]; languages?: string[]; initialLanguage?: string }) {
  const tx = useTx()
  const [rows, setRows] = useState<Tpl[]>(initial)
  const [lang, setLang] = useState(initialLanguage)
  const [loadingLang, setLoadingLang] = useState(false)

  // E28 · HU-465 · cambia el idioma que se edita (cada idioma guarda su versión).
  async function switchLanguage(next: string) {
    if (next === lang) return
    setLoadingLang(true)
    try {
      const res = await fetch(`/api/admin/email-templates?locale=${encodeURIComponent(next)}`)
      const d = await res.json()
      if (res.ok) { setRows(d.templates); setLang(next); setOpen(null); setPreview({}); setMsg({}) }
    } finally { setLoadingLang(false) }
  }
  const [open, setOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Record<string, { subject: string; html: string } | null>>({})

  async function doPreview(t: Tpl) {
    const res = await fetch('/api/admin/email-templates/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: t.type, subject: t.subject, body: t.body, locale: lang }),
    })
    const d = await res.json()
    if (res.ok) setPreview((p) => ({ ...p, [t.type]: { subject: d.subject, html: d.html } }))
    else setMsg((m) => ({ ...m, [t.type]: d.error ?? 'Error' }))
  }
  async function sendTest(t: Tpl) {
    setMsg((m) => ({ ...m, [t.type]: tx('Enviando prueba…') }))
    const res = await fetch('/api/admin/email-templates/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: t.type, subject: t.subject, body: t.body, send: true, locale: lang }),
    })
    const d = await res.json()
    setMsg((m) => ({ ...m, [t.type]: res.ok ? tx("Prueba enviada a {to}", { to: d.to }) : (d.error ?? 'Error') }))
  }

  function patch(type: string, p: Partial<Tpl>) {
    setRows((rs) => rs.map((r) => (r.type === type ? { ...r, ...p } : r)))
  }

  async function save(t: Tpl) {
    setSaving(t.type); setMsg((m) => ({ ...m, [t.type]: '' }))
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: t.type, subject: t.subject, body: t.body, enabled: t.enabled, locale: lang }),
      })
      const d = await res.json()
      setMsg((m) => ({ ...m, [t.type]: res.ok ? tx('Guardado.') : (d.error ?? 'Error') }))
      if (res.ok) patch(t.type, { customized: true })
    } finally { setSaving(null) }
  }

  return (
    <div className="space-y-3">
      {languages.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={tx("Idioma de la plantilla")}>
          <span className="font-brand text-xs text-brand-primary/60"><T>Idioma de la plantilla</T></span>
          {languages.map((l) => (
            <button key={l} type="button" role="tab" aria-selected={l === lang} disabled={loadingLang} onClick={() => switchLanguage(l)}
              className={`rounded-full px-3 py-1 font-brand text-xs border ${l === lang ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-brand-primary/20 text-brand-primary hover:bg-brand-cream'}`}>
              {LANGUAGE_LABEL[l] ?? l}
            </button>
          ))}
          <span className="font-brand text-[11px] text-brand-primary/40"><T>Cada cliente recibe el correo en el idioma en que compró.</T></span>
        </div>
      )}
      {rows.map((t) => (
        <div key={t.type} className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1">
              <p className="font-brand font-semibold text-brand-primary">{t.label}
                {t.customized && <span className="ml-2 font-brand text-[11px] text-brand-primary/40"><T>personalizada</T></span>}
              </p>
              <p className="font-brand text-xs text-brand-primary/40 font-mono">{t.type}</p>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={t.enabled} onChange={(e) => patch(t.type, { enabled: e.target.checked })} className="w-4 h-4 accent-brand-primary" />
              <span className="font-brand text-xs text-brand-primary/60">{t.enabled ? tx("Activa") : tx("Silenciada")}</span>
            </label>
            <button onClick={() => setOpen(open === t.type ? null : t.type)}
              className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">
              {open === t.type ? tx("Cerrar") : tx("Editar")}
            </button>
          </div>
          {open === t.type && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              <label className="block">
                <span className="font-brand text-xs text-brand-primary/50"><T>Asunto</T></span>
                <input value={t.subject} onChange={(e) => patch(t.type, { subject: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" />
              </label>
              <label className="block">
                <span className="font-brand text-xs text-brand-primary/50"><T>Cuerpo</T></span>
                <textarea value={t.body} onChange={(e) => patch(t.type, { body: e.target.value })} rows={6}
                  className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" />
              </label>
              <p className="font-brand text-[11px] text-brand-primary/40">
                <T>Variables:</T> {t.vars.map((v) => `{{${v}}}`).join('  ')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => save(t)} disabled={saving === t.type}
                  className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50">
                  {saving === t.type ? tx("Guardando…") : tx("Guardar")}
                </button>
                <button onClick={() => doPreview(t)} type="button"
                  className="font-brand text-sm border border-brand-primary/20 text-brand-primary rounded-full px-4 py-2 hover:bg-brand-cream"><T>Vista previa</T></button>
                <button onClick={() => sendTest(t)} type="button"
                  className="font-brand text-sm border border-brand-primary/20 text-brand-primary rounded-full px-4 py-2 hover:bg-brand-cream"><T>Enviar prueba</T></button>
                {msg[t.type] && <span className="font-brand text-xs text-brand-primary/60">{msg[t.type]}</span>}
              </div>
              {preview[t.type] && (
                <div className="mt-2 border border-brand-primary/10 rounded-xl overflow-hidden">
                  <p className="font-brand text-xs text-brand-primary/50 px-3 py-2 border-b border-brand-primary/10"><T>Asunto:</T> <strong>{preview[t.type]!.subject}</strong></p>
                  <iframe title="preview" srcDoc={preview[t.type]!.html} className="w-full h-72 bg-white" />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
