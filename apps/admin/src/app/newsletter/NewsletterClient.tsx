'use client'

import { useState } from 'react'
import type { NewsletterSubscriber } from '@merkiai/database'
import { formatDate } from '@merkiai/i18n'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface Props {
  initialSubscribers: NewsletterSubscriber[]
}

type Tab = 'suscriptores' | 'enviar'

export default function NewsletterClient({ initialSubscribers }: Props) {
  const tx = useTx()
  const [tab, setTab] = useState<Tab>('suscriptores')
  const [subscribers] = useState<NewsletterSubscriber[]>(initialSubscribers)

  // Compose form state
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const activeCount = subscribers.filter((s) => s.active).length

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return

    const confirmed = window.confirm(
      `¿Enviar este correo a ${activeCount} suscriptor${activeCount !== 1 ? 'es' : ''} activo${activeCount !== 1 ? 's' : ''}?`,
    )
    if (!confirmed) return

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? 'Error al enviar' })
      } else {
        setResult({
          ok: true,
          message: `✅ Enviado a ${data.sent} suscriptor${data.sent !== 1 ? 'es' : ''}${data.failed > 0 ? ` (${data.failed} fallaron)` : ''}`,
        })
        setSubject('')
        setBody('')
      }
    } catch {
      setResult({ ok: false, message: 'Error de conexión' })
    } finally {
      setSending(false)
    }
  }

  function handleExportCSV() {
    const header = 'id,email,subscribed_at,active'
    const rows = subscribers.map(
      (s) => `${s.id},"${s.email}","${s.subscribed_at}",${s.active}`,
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter_subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-primary/5">
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide mb-1"><T>Total</T></p>
          <p className="font-display text-brand-primary text-3xl">{subscribers.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-primary/5">
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide mb-1"><T>Activos</T></p>
          <p className="font-display text-green-700 text-3xl">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-primary/5">
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide mb-1"><T>Inactivos</T></p>
          <p className="font-display text-brand-primary/40 text-3xl">{subscribers.length - activeCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-cream rounded-xl p-1 w-fit">
        {(['suscriptores', 'enviar'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg font-brand text-sm transition-colors capitalize ${
              tab === t
                ? 'bg-white text-brand-primary shadow-sm font-semibold'
                : 'text-brand-primary/50 hover:text-brand-primary'
            }`}
          >
            {t === 'suscriptores' ? 'Suscriptores' : 'Enviar campaña'}
          </button>
        ))}
      </div>

      {/* Suscriptores tab */}
      {tab === 'suscriptores' && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-primary/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-primary/5">
            <p className="font-brand text-sm text-brand-primary/60">
              {subscribers.length} suscriptor{subscribers.length !== 1 ? 'es' : ''}
            </p>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-brand text-sm bg-brand-cream text-brand-primary hover:bg-brand-cream/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <T>Exportar CSV</T>
            </button>
          </div>

          {subscribers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-brand text-brand-primary/30 text-sm"><T>No hay suscriptores aún</T></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-primary/5">
                    <th className="text-left px-6 py-3 font-brand text-xs text-brand-primary/40 uppercase tracking-wide"><T>Email</T></th>
                    <th className="text-left px-6 py-3 font-brand text-xs text-brand-primary/40 uppercase tracking-wide"><T>Fecha</T></th>
                    <th className="text-left px-6 py-3 font-brand text-xs text-brand-primary/40 uppercase tracking-wide"><T>Estado</T></th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} className="border-b border-brand-primary/5 last:border-0 hover:bg-brand-cream/30 transition-colors">
                      <td className="px-6 py-3 font-brand text-sm text-brand-primary">{s.email}</td>
                      <td className="px-6 py-3 font-brand text-sm text-brand-primary/50">
                        {formatDate(s.subscribed_at, {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-brand text-xs font-semibold ${
                          s.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {s.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enviar campaña tab */}
      {tab === 'enviar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-primary/5 p-6">
          <div className="mb-6">
            <h2 className="font-brand font-semibold text-brand-primary mb-1"><T>Nueva campaña</T></h2>
            <p className="font-brand text-sm text-brand-primary/50">
              <T>Se enviará a</T> <strong>{activeCount}</strong> suscriptor{activeCount !== 1 ? 'es' : ''} activo{activeCount !== 1 ? 's' : ''}.
              Puedes usar <strong><T>**negrita**</T></strong> y <em><T>*cursiva*</T></em>.
            </p>
          </div>

          {result && (
            <div className={`mb-6 px-4 py-3 rounded-xl font-brand text-sm ${
              result.ok
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {result.message}
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block font-brand text-sm text-brand-primary/70 mb-1.5">
                <T>Asunto</T>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={tx("Ej: Novedades de esta semana")}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-brand-primary/15 font-brand text-sm text-brand-primary bg-brand-cream/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30"
              />
            </div>

            <div>
              <label className="block font-brand text-sm text-brand-primary/70 mb-1.5">
                <T>Contenido</T>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                placeholder={`## Hola a todos\n\nEscribe aquí el contenido de tu campaña.\n\nPuedes usar:\n- **negrita** para destacar\n- *cursiva* para énfasis\n- ## Títulos para secciones`}
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-primary/15 font-brand text-sm text-brand-primary bg-brand-cream/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 resize-y font-mono"
              />
              <p className="mt-1.5 font-brand text-xs text-brand-primary/40">
                <T>Acepta formato Markdown básico: ## Títulos, **negrita**, *cursiva*, - listas</T>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="font-brand text-xs text-brand-primary/40">
                {activeCount === 0
                  ? '⚠️ No hay suscriptores activos'
                  : `Enviando a ${activeCount} destinatario${activeCount !== 1 ? 's' : ''}`}
              </p>
              <button
                type="submit"
                disabled={sending || activeCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-brand text-sm font-semibold bg-brand-primary text-brand-cream hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <T>Enviando…</T>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <T>Enviar campaña</T>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
