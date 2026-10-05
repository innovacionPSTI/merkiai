'use client'

/**
 * CsvImportModal — modal genérico de importación por CSV (HU-132). Reutilizable
 * por cualquier entidad cuyo endpoint acepte { csv, mode?, preview? } y responda
 * con { toCreate, toUpdate, skipped[], parseErrors[], created, updated, errors[] }.
 */
import { useRef, useState } from 'react'
import { Icon } from '@merkiai/ui'

interface Summary {
  toCreate: number
  toUpdate: number
  skipped: { slug: string; reason: string }[]
  parseErrors: { row: number; message: string }[]
  created?: number
  updated?: number
  errors?: { slug: string; message: string }[]
}

interface Props {
  endpoint: string
  entityLabel: string          // p. ej. "categorías"
  triggerLabel?: string        // texto del botón
  triggerClassName?: string
  onDone?: () => void          // tras una importación exitosa (no preview)
}

export default function CsvImportModal({ endpoint, entityLabel, triggerLabel = 'Importar CSV', triggerClassName, onDone }: Props) {
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [upsert, setUpsert] = useState(false)
  const [preview, setPreview] = useState<Summary | null>(null)
  const [result, setResult] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const mode = upsert ? 'upsert' : 'create'

  function reset() { setCsv(''); setFileName(''); setUpsert(false); setPreview(null); setResult(null); setError(''); if (fileRef.current) fileRef.current.value = '' }
  function close() { setOpen(false); reset() }

  async function call(text: string, m: string, previewFlag: boolean): Promise<Summary | null> {
    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: text, mode: m, preview: previewFlag }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error'); return null }
    return data
  }

  async function onFile(file: File) {
    setError(''); setPreview(null); setResult(null)
    const text = await file.text()
    setCsv(text); setFileName(file.name)
    setBusy(true); try { const d = await call(text, mode, true); if (d) setPreview(d) } finally { setBusy(false) }
  }
  async function rePreview(m: string) {
    if (!csv) return
    setBusy(true); try { const d = await call(csv, m, true); if (d) setPreview(d) } finally { setBusy(false) }
  }
  async function confirm() {
    setBusy(true); setError('')
    try { const d = await call(csv, mode, false); if (d) { setResult(d); onDone?.() } }
    finally { setBusy(false) }
  }

  const errs = result?.errors ?? []
  const total = (preview?.toCreate ?? 0) + (preview?.toUpdate ?? 0)

  return (
    <>
      <button onClick={() => setOpen(true)} className={triggerClassName ?? 'border border-brand-primary/20 text-brand-primary rounded-xl px-4 py-2 font-brand text-sm hover:bg-brand-cream transition-colors inline-flex items-center gap-2'}>
        <Icon name="catalog" size={16} /> {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={close}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-brand-primary text-lg">Importar {entityLabel}</h2>
              <button onClick={close} className="text-brand-primary/40 hover:text-brand-primary" aria-label="Cerrar"><Icon name="close" size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!result && (
                <>
                  <a href={endpoint} className="font-brand text-xs text-brand-primary underline inline-flex items-center gap-1">
                    <Icon name="external" size={13} /> Descargar plantilla de ejemplo
                  </a>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f) }} />
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 font-brand text-sm text-brand-primary/50 hover:border-brand-primary/40 hover:bg-gray-50 transition-colors flex flex-col items-center gap-2">
                    <Icon name="catalog" size={24} className="text-brand-primary/40" />
                    {fileName ? <span className="text-brand-primary">{fileName}</span> : 'Selecciona un archivo CSV'}
                  </button>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={upsert} onChange={(e) => { setUpsert(e.target.checked); void rePreview(e.target.checked ? 'upsert' : 'create') }} className="w-4 h-4 mt-0.5 accent-brand-primary" />
                    <span>
                      <span className="font-brand text-sm text-brand-primary block">Actualizar existentes</span>
                      <span className="font-brand text-xs text-brand-primary/50">Si el <code className="text-[11px]">slug</code> ya existe, se actualiza en vez de omitirlo.</span>
                    </span>
                  </label>
                </>
              )}

              {error && <p className="font-brand text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

              {preview && !result && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4 font-brand text-sm">
                    <span className="text-brand-primary"><strong>{preview.toCreate}</strong> se crearán</span>
                    {preview.toUpdate > 0 && <span className="text-blue-600"><strong>{preview.toUpdate}</strong> se actualizan</span>}
                    {preview.skipped.length > 0 && <span className="text-amber-600"><strong>{preview.skipped.length}</strong> se omiten</span>}
                    {preview.parseErrors.length > 0 && <span className="text-red-500"><strong>{preview.parseErrors.length}</strong> con error</span>}
                  </div>
                  {preview.parseErrors.length > 0 && (
                    <ul className="text-xs font-brand text-red-500 bg-red-50 rounded-lg p-3 space-y-0.5 max-h-28 overflow-y-auto">
                      {preview.parseErrors.map((e, i) => <li key={i}>{e.row ? `Fila ${e.row}: ` : ''}{e.message}</li>)}
                    </ul>
                  )}
                  {preview.skipped.length > 0 && (
                    <ul className="text-xs font-brand text-amber-700 bg-amber-50 rounded-lg p-3 space-y-0.5 max-h-28 overflow-y-auto">
                      {preview.skipped.map((s, i) => <li key={i}>{s.slug}: {s.reason}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-brand text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                    <Icon name="check" size={16} />
                    <span><strong>{result.created ?? 0}</strong> creada(s){(result.updated ?? 0) > 0 && <> · <strong>{result.updated}</strong> actualizada(s)</>}.</span>
                  </div>
                  {errs.length > 0 && (
                    <ul className="text-xs font-brand text-red-500 bg-red-50 rounded-lg p-3 space-y-0.5 max-h-28 overflow-y-auto">
                      {errs.map((e, i) => <li key={i}>{e.slug}: {e.message}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={close} className="flex-1 font-brand text-sm border border-gray-200 text-brand-primary px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">{result ? 'Cerrar' : 'Cancelar'}</button>
              {!result && (
                <button onClick={confirm} disabled={busy || !preview || total === 0}
                  className="flex-1 font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50">
                  {busy ? 'Importando…' : preview ? `Importar ${total}` : 'Importar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
