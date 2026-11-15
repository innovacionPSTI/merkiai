'use client'

import { useState, useTransition } from 'react'
import { sendStatementAction } from '../../actions'
import { T } from '@merkiai/ui'

/** Imprimir / PDF (diálogo del navegador) y enviar el estado de cuenta por correo. */
export default function PrintButton({ partyId, hasEmail }: { partyId?: string; hasEmail?: boolean }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <div className="mt-2 flex flex-col items-end gap-1 print:hidden">
      <div className="flex gap-2">
        <button type="button" onClick={() => window.print()} className="rounded-full border border-gray-200 px-4 py-1.5 font-brand text-xs text-brand-primary hover:border-brand-primary"><T>Imprimir / PDF</T></button>
        {partyId && hasEmail && (
          <button type="button" disabled={pending} onClick={() => start(async () => { const r = await sendStatementAction(partyId); setMsg(r.ok ? { ok: true, text: r.message ?? 'Enviado.' } : { ok: false, text: r.error }) })}
            className="rounded-full border border-gray-200 px-4 py-1.5 font-brand text-xs text-brand-primary hover:border-brand-primary disabled:opacity-50">{pending ? 'Enviando…' : 'Enviar por correo'}</button>
        )}
      </div>
      {msg && <p role="status" className={`font-brand text-xs ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  )
}
