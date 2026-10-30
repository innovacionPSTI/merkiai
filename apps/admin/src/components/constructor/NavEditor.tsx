'use client'

/**
 * NavEditor (HU-367) — gestión de la navegación (menú del header) DENTRO del
 * Constructor, para no saltar a "Páginas". CRUD de `nav_items` vía /api/admin/nav,
 * con jerarquía padre/hijo (1 nivel) y vínculo a una página (href = /slug).
 * Sin diálogos nativos (ConfirmDialog de marca).
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon, ConfirmDialog } from '@merkiai/ui'

interface NavItem { id: number; label: string; href: string | null; enabled: boolean; order_index: number; parent_id: number | null; page_key?: string | null }
interface PageOpt { key: string; label: string; slug: string }

export default function NavEditor({ pages }: { pages: PageOpt[] }) {
  const [items, setItems] = useState<NavItem[]>([])
  const [msg, setMsg] = useState('')
  const [delId, setDelId] = useState<number | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newParent, setNewParent] = useState<string>('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/nav')
    if (res.ok) setItems(await res.json())
  }, [])
  useEffect(() => { void load() }, [load])

  const tops = items.filter((i) => i.parent_id === null).sort((a, b) => a.order_index - b.order_index)
  const childrenOf = (id: number) => items.filter((i) => i.parent_id === id).sort((a, b) => a.order_index - b.order_index)

  async function create() {
    const label = newLabel.trim()
    if (!label) return
    const res = await fetch('/api/admin/nav', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, parent_id: newParent ? Number(newParent) : null, order_index: tops.length, enabled: true }),
    })
    if (!res.ok) { setMsg('No se pudo crear'); return }
    setNewLabel(''); setNewParent(''); setMsg('Elemento agregado ✓'); await load()
  }
  async function patch(id: number, fields: Partial<NavItem>) {
    const res = await fetch('/api/admin/nav', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    })
    if (res.ok) { const d = await res.json(); setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...d } : x))) }
  }
  async function linkPage(id: number, pageKey: string) {
    const p = pageKey ? pages.find((x) => x.key === pageKey) : null
    await patch(id, { page_key: pageKey || null, href: p ? `/${p.slug}` : null } as Partial<NavItem>)
  }
  async function doDelete(id: number) {
    await fetch(`/api/admin/nav?id=${id}`, { method: 'DELETE' })
    setItems((xs) => xs.filter((x) => x.id !== id && x.parent_id !== id)); setMsg('Elemento eliminado ✓')
  }

  function Row({ it, child }: { it: NavItem; child?: boolean }) {
    const linked = it.page_key ? pages.find((p) => p.key === it.page_key) : null
    return (
      <div className={`flex items-center gap-2 py-1.5 ${child ? 'pl-5' : ''}`}>
        <button onClick={() => patch(it.id, { enabled: !it.enabled })} title={it.enabled ? 'Visible' : 'Oculto'}
          className={`w-2 h-2 rounded-full flex-shrink-0 ${it.enabled ? 'bg-green-500' : 'bg-slate-300'}`} aria-label="Alternar visibilidad" />
        <input defaultValue={it.label} onBlur={(e) => e.target.value.trim() && e.target.value !== it.label && patch(it.id, { label: e.target.value.trim() })}
          className="flex-1 min-w-0 rounded border border-slate-200 px-2 py-1 text-sm" aria-label="Nombre del elemento" />
        <select value={it.page_key ?? ''} onChange={(e) => linkPage(it.id, e.target.value)}
          className="rounded border border-slate-200 px-1 py-1 text-xs max-w-[9rem]" aria-label="Página vinculada" title="Vincular a una página">
          <option value="">{it.href ? `↗ ${it.href}` : '— Libre —'}</option>
          {pages.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <button onClick={() => setDelId(it.id)} className="text-slate-300 hover:text-red-500" aria-label="Eliminar">✕</button>
        {linked && <span className="sr-only">vinculada a {linked.slug}</span>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {msg && <p className="text-xs text-indigo-600">{msg}</p>}
      <div className="divide-y divide-slate-100">
        {tops.map((it) => (
          <div key={it.id}>
            <Row it={it} />
            {childrenOf(it.id).map((c) => <Row key={c.id} it={c} child />)}
          </div>
        ))}
        {tops.length === 0 && <p className="text-xs text-slate-400 py-3 text-center">Sin elementos de menú.</p>}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Nuevo elemento…"
          className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm" aria-label="Nombre del nuevo elemento" />
        <select value={newParent} onChange={(e) => setNewParent(e.target.value)} className="rounded border border-slate-300 px-1 py-1.5 text-xs" aria-label="Subelemento de">
          <option value="">Nivel raíz</option>
          {tops.map((t) => <option key={t.id} value={t.id}>↳ {t.label}</option>)}
        </select>
        <button onClick={create} disabled={!newLabel.trim()} className="rounded-lg bg-brand-primary text-brand-cream px-3 py-1.5 text-sm hover:bg-brand-dark disabled:opacity-40">
          <Icon name="plus" size={14} />
        </button>
      </div>

      <ConfirmDialog
        open={delId !== null}
        title="Eliminar del menú"
        message="¿Eliminar este elemento del menú (y sus subelementos)?"
        danger confirmLabel="Eliminar"
        onConfirm={() => { const id = delId; setDelId(null); if (id != null) void doDelete(id) }}
        onCancel={() => setDelId(null)}
      />
    </div>
  )
}
