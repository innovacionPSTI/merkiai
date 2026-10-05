'use client'

/**
 * AddBlockCatalog — catálogo visual de bloques (HU-268). Reemplaza el <select>
 * "Agregar bloque…" por una galería con icono + descripción, agrupada por
 * categoría. Un clic en una tarjeta agrega el bloque.
 */
import { useEffect, useRef, useState } from 'react'
import { listBlockTypes } from '@merkiai/database/blocks'
import { Icon, type IconName } from '@merkiai/ui'

const CATEGORY: Record<string, { label: string; icon: IconName }> = {
  content:    { label: 'Contenido',    icon: 'content' },
  commerce:   { label: 'Comercio',     icon: 'catalog' },
  engagement: { label: 'Interacción',  icon: 'newsletter' },
}

export default function AddBlockCatalog({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const blocks = listBlockTypes()
  const cats = Object.keys(CATEGORY).filter((c) => blocks.some((b) => b.category === c))

  function pick(type: string) {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name="plus" size={16} /> Agregar bloque
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-[22rem] max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          {cats.map((cat) => (
            <div key={cat} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Icon name={CATEGORY[cat].icon} size={13} /> {CATEGORY[cat].label}
              </div>
              <div className="space-y-1">
                {blocks.filter((b) => b.category === cat).map((b) => (
                  <button
                    key={b.type}
                    role="menuitem"
                    onClick={() => pick(b.type)}
                    className="flex w-full items-start gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left hover:border-indigo-200 hover:bg-indigo-50/60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon name={CATEGORY[cat].icon} size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">{b.label}</span>
                      <span className="block text-xs text-slate-400">{b.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
