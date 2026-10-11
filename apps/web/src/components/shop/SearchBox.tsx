'use client'

/**
 * SearchBox — buscador con autocompletado (HU-102). Debounce + dropdown de
 * sugerencias (nombre/imagen/precio) desde `/api/search/suggest`. Teclado:
 * ↑/↓ para moverse, Enter para abrir la sugerencia activa o buscar el texto.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@merkiai/ui'

interface Suggestion {
  id: number
  name: string
  slug: string
  image_url: string | null
  min_price: number | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function SearchBox({ initialQuery = '', onSearch }: { initialQuery?: string; onSearch: (q: string) => void }) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQ(initialQuery) }, [initialQuery])

  // Debounce + fetch de sugerencias (aborta la petición anterior).
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setItems([]); setOpen(false); return }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        const data = await res.json()
        setItems(data.suggestions ?? [])
        setOpen(true); setActive(-1)
      } catch { /* abort/net → ignora */ }
    }, 200)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q])

  // Cerrar al clic fuera.
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function submit() { setOpen(false); onSearch(q) }
  function go(s: Suggestion) { setOpen(false); router.push(`/shop/${s.slug}`) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) { if (e.key === 'Enter') submit(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0) go(items[active]); else submit() }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="relative" role="search">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none">
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (items.length > 0) setOpen(true) }}
          placeholder="Buscar productos…"
          aria-label="Buscar productos"
          aria-autocomplete="list"
          aria-expanded={open}
          className="font-brand text-sm border border-brand-primary/20 rounded-full pl-9 pr-4 py-2 bg-white text-brand-primary focus:outline-none focus:border-brand-primary w-44 sm:w-64 transition-all"
        />
      </form>

      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-2 right-0 w-72 sm:w-80 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5" role="listbox">
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <Link
                href={`/shop/${s.slug}`}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${i === active ? 'bg-brand-cream/60' : 'hover:bg-gray-50'}`}
              >
                <span className="w-10 h-10 rounded-lg bg-brand-cream overflow-hidden shrink-0">
                  {s.image_url
                    ? <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                    : <span className="block w-full h-full bg-brand-yellow/30" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-brand text-sm text-brand-primary truncate">{s.name}</span>
                  {s.min_price != null && <span className="block font-brand text-xs text-brand-price">{fmt(s.min_price)}</span>}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={submit}
              className="w-full text-left rounded-xl px-2.5 py-2 font-brand text-xs text-brand-primary/60 hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <Icon name="search" size={13} /> Ver todos los resultados de “{q.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
