'use client'

import { useState } from 'react'

interface Tpl { type: string; label: string; vars: string[]; subject: string; body: string; enabled: boolean; customized: boolean }

export default function EmailTemplatesEditor({ initial }: { initial: Tpl[] }) {
  const [rows, setRows] = useState<Tpl[]>(initial)
  const [open, setOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Record<string, { subject: string; html: string } | null>>({})

  async function doPreview(t: Tpl) {
    const res = await fetch('/api/admin/email-templates/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: t.type, subject: t.subject, body: t.body }),
    })
    const d = await res.json()
    if (res.ok) setPreview((p) => ({ ...p, [t.type]: { subject: d.subject, html: d.html } }))
    else setMsg((m) => ({ ...m, [t.type]: d.error ?? 'Error' }))
  }
  async function sendTest(t: Tpl) {
    setMsg((m) => ({ ...m, [t.type]: 'Enviando prueba…' }))
    const res = await fetch('/api/admin/email-templates/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: t.type, subject: t.subject, body: t.body, send: true }),
    })
    const d = await res.json()
    setMsg((m) => ({ ...m, [t.type]: res.ok ? `Prueba enviada a ${d.to}` : (d.error ?? 'Error') }))
  }

  function patch(type: string, p: Partial<Tpl>) {
    setRows((rs) => rs.map((r) => (r.type === type ? { ...r, ...p } : r)))
  }

  async function save(t: Tpl) {
    setSaving(t.type); setMsg((m) => ({ ...m, [t.type]: '' }))
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: t.type, subject: t.subject, body: t.body, enabled: t.enabled }),
      })
      const d = await res.json()
      setMsg((m) => ({ ...m, [t.type]: res.ok ? 'Guardado.' : (d.error ?? 'Error') }))
      if (res.ok) patch(t.type, { customized: true })
    } finally { setSaving(null) }
  }

  return (
    <div className="space-y-3">
      {rows.map((t) => (
        <div key={t.type} className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1">
              <p className="font-brand font-semibold text-brand-primary">{t.label}
                {t.customized && <span className="ml-2 font-brand text-[11px] text-brand-primary/40">personalizada</span>}
              </p>
              <p className="font-brand text-xs text-brand-primary/40 font-mono">{t.type}</p>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={t.enabled} onChange={(e) => patch(t.type, { enabled: e.target.checked })} className="w-4 h-4 accent-brand-primary" />
              <span className="font-brand text-xs text-brand-primary/60">{t.enabled ? 'Activa' : 'Silenciada'}</span>
            </label>
            <button onClick={() => setOpen(open === t.type ? null : t.type)}
              className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-cream">
              {open === t.type ? 'Cerrar' : 'Editar'}
            </button>
          </div>
          {open === t.type && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              <label className="block">
                <span className="font-brand text-xs text-brand-primary/50">Asunto</span>
                <input value={t.subject} onChange={(e) => patch(t.type, { subject: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" />
              </label>
              <label className="block">
                <span className="font-brand text-xs text-brand-primary/50">Cuerpo</span>
                <textarea value={t.body} onChange={(e) => patch(t.type, { body: e.target.value })} rows={6}
                  className="mt-1 w-full rounded-lg border border-brand-primary/15 px-3 py-2 font-brand text-sm" />
              </label>
              <p className="font-brand text-[11px] text-brand-primary/40">
                Variables: {t.vars.map((v) => `{{${v}}}`).join('  ')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => save(t)} disabled={saving === t.type}
                  className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark disabled:opacity-50">
                  {saving === t.type ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => doPreview(t)} type="button"
                  className="font-brand text-sm border border-brand-primary/20 text-brand-primary rounded-full px-4 py-2 hover:bg-brand-cream">Vista previa</button>
                <button onClick={() => sendTest(t)} type="button"
                  className="font-brand text-sm border border-brand-primary/20 text-brand-primary rounded-full px-4 py-2 hover:bg-brand-cream">Enviar prueba</button>
                {msg[t.type] && <span className="font-brand text-xs text-brand-primary/60">{msg[t.type]}</span>}
              </div>
              {preview[t.type] && (
                <div className="mt-2 border border-brand-primary/10 rounded-xl overflow-hidden">
                  <p className="font-brand text-xs text-brand-primary/50 px-3 py-2 border-b border-brand-primary/10">Asunto: <strong>{preview[t.type]!.subject}</strong></p>
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
