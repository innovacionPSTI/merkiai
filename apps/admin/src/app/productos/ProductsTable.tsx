'use client'

/**
 * ProductsTable — listado de productos con selección múltiple y acciones
 * masivas (HU-131): publicar/despublicar, destacar, cambiar categoría y
 * eliminar. Todo vía `POST /api/admin/products/batch` (RLS por tenant).
 */
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@merkiai/ui'

interface Category { id: number; name: string }
interface Props { products: any[]; categories: Category[]; emptyQ?: string }

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function ProductsTable({ products, categories, emptyQ }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [catPicker, setCatPicker] = useState(false)

  const ids = products.map((p) => p.id)
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))
  const someChecked = selected.size > 0

  function toggle(id: number) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(ids))
  }

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (selected.size === 0) return
    if (action === 'delete' && !confirm(`¿Eliminar ${selected.size} producto(s)? Esta acción no se puede deshacer.`)) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error en la acción'); return }
      setSelected(new Set()); setCatPicker(false)
      router.refresh()
    } finally { setBusy(false) }
  }

  if (!products.length) {
    return (
      <div className="font-brand text-brand-primary/40 text-center py-12">
        {emptyQ
          ? `Sin resultados para "${emptyQ}"`
          : <><span>No hay productos. </span><Link href="/productos/nuevo" className="underline">Crear el primero →</Link></>}
      </div>
    )
  }

  return (
    <div className="relative">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 pl-6 w-10">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-brand-primary" aria-label="Seleccionar todos" />
            </th>
            {['Imagen', 'Nombre', 'Categoría', 'Variantes', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => (
              <th key={h} className="font-brand text-xs font-semibold text-brand-primary/50 text-left px-4 py-3 last:pr-6">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => {
            const prices = product.variants?.map((v: any) => v.price) ?? []
            const minPrice = prices.length ? Math.min(...prices) : 0
            const maxPrice = prices.length ? Math.max(...prices) : 0
            const totalStock = product.variants?.reduce((s: number, v: any) => s + v.stock, 0) ?? 0
            const checked = selected.has(product.id)
            return (
              <tr key={product.id} className={`transition-colors ${checked ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-3 pl-6">
                  <input type="checkbox" checked={checked} onChange={() => toggle(product.id)} className="w-4 h-4 accent-brand-primary" aria-label={`Seleccionar ${product.name}`} />
                </td>
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-cream overflow-hidden">
                    {product.images?.[0]?.url
                      ? <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-brand-yellow/30" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-brand font-semibold text-brand-primary text-sm">{product.name}</p>
                  <p className="font-brand text-xs text-brand-primary/40">{product.slug}</p>
                </td>
                <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">{product.variants?.length ?? 0}</td>
                <td className="px-4 py-3 font-brand text-sm text-brand-primary">
                  {prices.length ? (minPrice === maxPrice ? fmt(minPrice) : `${fmt(minPrice)} – ${fmt(maxPrice)}`) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-brand text-xs font-semibold rounded-full px-2 py-1 ${totalStock > 5 ? 'bg-green-100 text-green-700' : totalStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{totalStock}u</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-brand text-xs rounded-full px-2 py-1 ${product.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{product.active ? 'Publicado' : 'Borrador'}</span>
                </td>
                <td className="px-4 py-3 pr-6">
                  <Link href={`/productos/${product.id}`} className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-primary hover:text-brand-cream transition-colors">Editar</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Barra flotante de acciones masivas */}
      {someChecked && (
        <div className="sticky bottom-4 mt-3 mx-4 z-10">
          <div className="bg-brand-primary text-brand-cream rounded-2xl shadow-lg px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="font-brand text-sm font-semibold mr-1">{selected.size} seleccionado(s)</span>
            <button onClick={() => run('activate')} disabled={busy} className="font-brand text-xs bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 disabled:opacity-50">Publicar</button>
            <button onClick={() => run('deactivate')} disabled={busy} className="font-brand text-xs bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 disabled:opacity-50">Despublicar</button>
            <button onClick={() => run('feature')} disabled={busy} className="font-brand text-xs bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 disabled:opacity-50">Destacar</button>
            <button onClick={() => run('unfeature')} disabled={busy} className="font-brand text-xs bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 disabled:opacity-50">Quitar destacado</button>

            {/* Cambiar categoría */}
            <div className="relative">
              <button onClick={() => setCatPicker((v) => !v)} disabled={busy} className="font-brand text-xs bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1">
                Categoría <Icon name="chevron-right" size={12} className="rotate-90" />
              </button>
              {catPicker && (
                <div className="absolute bottom-full mb-2 left-0 w-52 max-h-56 overflow-y-auto bg-white text-brand-primary rounded-xl shadow-xl p-1">
                  <button onClick={() => run('set_category', { category_id: null })} className="w-full text-left font-brand text-xs px-3 py-2 rounded-lg hover:bg-gray-100">Sin categoría</button>
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => run('set_category', { category_id: c.id })} className="w-full text-left font-brand text-xs px-3 py-2 rounded-lg hover:bg-gray-100">{c.name}</button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => run('delete')} disabled={busy} className="font-brand text-xs bg-red-500/90 hover:bg-red-500 rounded-lg px-3 py-1.5 disabled:opacity-50 inline-flex items-center gap-1">
              <Icon name="trash" size={13} /> Eliminar
            </button>

            <button onClick={() => setSelected(new Set())} className="font-brand text-xs ml-auto underline opacity-80 hover:opacity-100">Deseleccionar</button>
            {error && <span className="font-brand text-xs text-red-200 w-full">{error}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
