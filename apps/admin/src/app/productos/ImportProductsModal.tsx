'use client'

/**
 * ImportProductsModal — importación masiva de productos por CSV (HU-124).
 * Sube un archivo, lo previsualiza (conteo + errores sin escribir) y confirma
 * la importación. La plantilla se descarga del propio endpoint.
 */
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@merkiai/ui'

interface Preview {
  parsed: number
  toCreate: number
  toUpdate: number
  skipped: { slug: string; reason: string }[]
  parseErrors: { row: number; message: string }[]
}
interface Result extends Preview {
  created: number
  updated: number
  createErrors: { slug: string; message: string }[]
  updateErrors: { slug: string; message: string }[]
}

const API = '/api/admin/products/import'

export default function ImportProductsModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [upsert, setUpsert] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const mode = upsert ? 'upsert' : 'create'

  function reset() {
    setCsv(''); setFileName(''); setPreview(null); setResult(null); setError(''); setUpsert(false)
    if (fileRef.current) fileRef.current.value = ''
  }
  function close() { setOpen(false); reset() }

  async function onFile(file: File) {
    setError(''); setPreview(null); setResult(null)
    const text = await file.text()
    setCsv(text); setFileName(file.name)
    await runPreview(text, mode)
  }

  async function runPreview(text: string, m: string) {
    setBusy(true); setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text, preview: true, mode: m }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al leer el CSV'); return }
      setPreview(data)
    } finally { setBusy(false) }
  }

  async function confirmImport() {
    setBusy(true); setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, mode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al importar'); return }
      setResult(data)
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-brand-primary/20 text-brand-primary rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-cream transition-colors inline-flex items-center gap-2"
      >
        <Icon name="catalog" size={16} /> Importar CSV
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={close}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-brand-primary text-lg">Importar productos</h2>
              <button onClick={close} className="text-brand-primary/40 hover:text-brand-primary" aria-label="Cerrar"><Icon name="close" size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!result && (
                <>
                  <p className="font-brand text-sm text-brand-primary/60">
                    Sube un archivo CSV. Cada fila es una variante; las filas con el mismo <code className="text-xs">slug</code> se agrupan en un producto.
                  </p>
                  <a
                    href={API}
                    className="font-brand text-xs text-brand-primary underline inline-flex items-center gap-1"
                  >
                    <Icon name="external" size={13} /> Descargar plantilla de ejemplo
                  </a>

                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f) }}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 font-brand text-sm text-brand-primary/50 hover:border-brand-primary/40 hover:bg-gray-50 transition-colors flex flex-col items-center gap-2"
                    >
                      <Icon name="catalog" size={24} className="text-brand-primary/40" />
                      {fileName ? <span className="text-brand-primary">{fileName}</span> : 'Selecciona un archivo CSV'}
                    </button>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={upsert}
                      onChange={(e) => {
                        const on = e.target.checked
                        setUpsert(on)
                        if (csv) void runPreview(csv, on ? 'upsert' : 'create')
                      }}
                      className="w-4 h-4 mt-0.5 accent-brand-primary"
                    />
                    <span>
                      <span className="font-brand text-sm text-brand-primary block">Actualizar productos existentes</span>
                      <span className="font-brand text-xs text-brand-primary/50">
                        Si un <code className="text-[11px]">slug</code> ya existe, se actualiza (nombre, precio, stock, variantes) en vez de omitirlo.
                      </span>
                    </span>
                  </label>
                </>
              )}

              {error && <p className="font-brand text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

              {/* Previsualización */}
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
                      {preview.parseErrors.map((e, i) => <li key={i}>Fila {e.row}: {e.message}</li>)}
                    </ul>
                  )}
                  {preview.skipped.length > 0 && (
                    <ul className="text-xs font-brand text-amber-700 bg-amber-50 rounded-lg p-3 space-y-0.5 max-h-28 overflow-y-auto">
                      {preview.skipped.map((s, i) => <li key={i}>{s.slug}: {s.reason}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* Resultado */}
              {result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-brand text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                    <Icon name="check" size={16} />
                    <span><strong>{result.created}</strong> creado(s){result.updated > 0 && <> · <strong>{result.updated}</strong> actualizado(s)</>}.</span>
                  </div>
                  {[...result.createErrors, ...result.updateErrors].length > 0 && (
                    <ul className="text-xs font-brand text-red-500 bg-red-50 rounded-lg p-3 space-y-0.5 max-h-28 overflow-y-auto">
                      {[...result.createErrors, ...result.updateErrors].map((e, i) => <li key={i}>{e.slug}: {e.message}</li>)}
                    </ul>
                  )}
                  {result.skipped.length > 0 && (
                    <ul className="text-xs font-brand text-amber-700 bg-amber-50 rounded-lg p-3 space-y-0.5 max-h-28 overflow-y-auto">
                      {result.skipped.map((s, i) => <li key={i}>{s.slug}: {s.reason}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={close}
                className="flex-1 font-brand text-sm border border-gray-200 text-brand-primary px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {result ? 'Cerrar' : 'Cancelar'}
              </button>
              {!result && (
                <button
                  onClick={confirmImport}
                  disabled={busy || !preview || (preview.toCreate + preview.toUpdate) === 0}
                  className="flex-1 font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {busy ? 'Importando…' : preview ? `Importar ${preview.toCreate + preview.toUpdate}` : 'Importar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
