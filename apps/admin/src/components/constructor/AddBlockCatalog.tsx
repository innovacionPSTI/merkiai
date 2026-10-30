'use client'

/**
 * AddBlockCatalog — catálogo visual de bloques (HU-268 → HU-365).
 * Galería con icono + descripción, con PESTAÑAS por categoría y BÚSQUEDA.
 * Las categorías se derivan del schema (`category`) con dos grupos virtuales:
 *   · "Dinámico"  → bloques que leen colecciones (p. ej. `collection_list`)
 *   · "Globales"  → bloques de reutilización (p. ej. `partial_ref`)
 * Un clic en una tarjeta agrega el bloque.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { listBlockTypes } from '@merkiai/database/blocks'
import { Icon, type IconName } from '@merkiai/ui'

const CATEGORY: Record<string, { label: string; icon: IconName }> = {
  content:    { label: 'Contenido',   icon: 'content' },
  commerce:   { label: 'Comercio',    icon: 'catalog' },
  dynamic:    { label: 'Dinámico',    icon: 'grid' },
  global:     { label: 'Globales',    icon: 'grid' },
  engagement: { label: 'Interacción', icon: 'newsletter' },
}
const CAT_ORDER = ['content', 'commerce', 'dynamic', 'global', 'engagement']

/** Categoría efectiva (virtuales Dinámico/Globales por tipo). */
function catOf(type: string, schemaCat: string): string {
  if (type === 'collection_list') return 'dynamic'
  if (type === 'partial_ref') return 'global'
  return schemaCat
}

export default function AddBlockCatalog({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<string>('all')
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const blocks = useMemo(() => listBlockTypes().map((b) => ({ ...b, cat: catOf(b.type, b.category) })), [])
  const cats = CAT_ORDER.filter((c) => blocks.some((b) => b.cat === c))
  const filtered = blocks.filter((b) => {
    if (tab !== 'all' && b.cat !== tab) return false
    if (q && !`${b.label} ${b.description}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  function pick(type: string) { onAdd(type); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        aria-expanded={open} aria-haspopup="menu"
      >
        <Icon name="plus" size={16} /> Agregar bloque
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-[24rem] max-h-[72vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar bloque…"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" aria-label="Buscar bloque"
            />
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setTab('all')} className={`rounded-full px-2.5 py-1 text-xs ${tab === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Todos</button>
              {cats.map((c) => (
                <button key={c} onClick={() => setTab(c)} className={`rounded-full px-2.5 py-1 text-xs ${tab === c ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{CATEGORY[c].label}</button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto p-3 space-y-1">
            {filtered.length === 0 && <p className="px-2 py-6 text-center text-xs text-slate-400">Sin bloques que coincidan</p>}
            {filtered.map((b) => (
              <button
                key={b.type} role="menuitem" onClick={() => pick(b.type)}
                className="flex w-full items-start gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left hover:border-indigo-200 hover:bg-indigo-50/60"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon name={CATEGORY[b.cat]?.icon ?? 'content'} size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{b.label}</span>
                  <span className="block text-xs text-slate-400">{b.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
