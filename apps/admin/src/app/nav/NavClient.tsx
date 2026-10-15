'use client'

import { useState, useCallback } from 'react'
import type { NavItem } from '@merkiai/database'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItemWithChildren extends NavItem {
  children: NavItem[]
}

interface Props {
  initialItems: NavItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTree(items: NavItem[]): NavItemWithChildren[] {
  const parents = items
    .filter((i) => i.parent_id === null)
    .sort((a, b) => a.order_index - b.order_index)
  return parents.map((p) => ({
    ...p,
    children: items
      .filter((i) => i.parent_id === p.id)
      .sort((a, b) => a.order_index - b.order_index),
  }))
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={onChange}
      className={`relative flex-shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        value ? 'bg-brand-primary' : 'bg-brand-primary/20'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NavClient({ initialItems }: Props) {
  const [items, setItems] = useState<NavItem[]>(initialItems)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState('')
  // HU-126 · reordenar por arrastre dentro del mismo nivel (mismo parent_id).
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)
  const dragParent = dragId !== null ? (items.find((i) => i.id === dragId)?.parent_id ?? null) : undefined

  async function moveNav(targetId: number) {
    const from = items.find((i) => i.id === dragId)
    const target = items.find((i) => i.id === targetId)
    if (!from || !target || from.id === target.id || from.parent_id !== target.parent_id) return
    const sibs = items.filter((i) => i.parent_id === from.parent_id).sort((a, b) => a.order_index - b.order_index)
    const fi = sibs.findIndex((s) => s.id === from.id)
    const ti = sibs.findIndex((s) => s.id === target.id)
    const next = [...sibs]
    const [moved] = next.splice(fi, 1)
    next.splice(ti, 0, moved)
    const reindexed = next.map((s, i) => ({ ...s, order_index: i }))
    setItems((prev) => prev.map((it) => {
      const r = reindexed.find((s) => s.id === it.id)
      return r ? { ...it, order_index: r.order_index } : it
    }))
    const changed = reindexed.filter((s) => sibs.find((o) => o.id === s.id)?.order_index !== s.order_index)
    await Promise.all(changed.map((s) =>
      fetch('/api/admin/nav', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, order_index: s.order_index }) }),
    ))
  }

  // New item form state (top-level)
  const [newLabel, setNewLabel] = useState('')
  const [newHref, setNewHref] = useState('/')
  const [newParentId, setNewParentId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const tree = buildTree(items)
  // Only top-level items can be parents (1-level dropdown max)
  const topLevel = items.filter((i) => i.parent_id === null)

  // ── API calls ────────────────────────────────────────────────────────────

  const patchItem = useCallback(
    async (id: number, fields: Partial<NavItem>) => {
      setSaving(id)
      setError('')
      try {
        const res = await fetch('/api/admin/nav', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...fields }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)))
      } catch {
        setError('Error de red')
      } finally {
        setSaving(null)
      }
    },
    []
  )

  const deleteItem = useCallback(async (id: number) => {
    if (!confirm('¿Eliminar este ítem y sus sub-ítems?')) return
    setSaving(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/nav?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { setError('Error al eliminar'); return }
      // Remove item and its children
      setItems((prev) => prev.filter((i) => i.id !== id && i.parent_id !== id))
    } catch {
      setError('Error de red')
    } finally {
      setSaving(null)
    }
  }, [])

  async function addItem() {
    if (!newLabel.trim()) return
    setAdding(true)
    setError('')
    try {
      const maxOrder =
        items.filter((i) => i.parent_id === newParentId).reduce((m, i) => Math.max(m, i.order_index), -1) + 1

      const res = await fetch('/api/admin/nav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel.trim(),
          href: newHref.trim() || null,
          enabled: true,
          order_index: maxOrder,
          parent_id: newParentId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear'); return }
      setItems((prev) => [...prev, data])
      setNewLabel('')
      setNewHref('/')
      setNewParentId(null)
      setShowAddForm(false)
    } catch {
      setError('Error de red')
    } finally {
      setAdding(false)
    }
  }

  // ── Row renderer ──────────────────────────────────────────────────────────

  function ItemRow({
    item,
    indent = false,
  }: {
    item: NavItem
    indent?: boolean
  }) {
    const [editLabel, setEditLabel] = useState(item.label)
    const [editHref, setEditHref] = useState(item.href ?? '')

    function saveLabel() {
      const trimmed = editLabel.trim()
      if (!trimmed || trimmed === item.label) return
      patchItem(item.id, { label: trimmed })
    }

    function saveHref() {
      const trimmed = editHref.trim()
      if (trimmed === (item.href ?? '')) return
      patchItem(item.id, { href: trimmed || null })
    }

    const isSaving = saving === item.id
    const sameLevel = dragId !== null && item.parent_id === dragParent
    const isDragged = dragId === item.id
    const isOver = sameLevel && overId === item.id && !isDragged

    return (
      <div
        onDragOver={(e) => { if (sameLevel) { e.preventDefault(); if (overId !== item.id) setOverId(item.id) } }}
        onDrop={(e) => { if (sameLevel) { e.preventDefault(); void moveNav(item.id) } setDragId(null); setOverId(null) }}
        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-all ${
          indent ? 'bg-gray-50 pl-10' : 'bg-white'
        } ${isDragged ? 'opacity-40' : ''} ${isOver ? 'shadow-[inset_0_2px_0_0_#818cf8]' : ''}`}
      >
        {/* Drag handle (HU-126) */}
        <span
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none text-sm"
          draggable
          onDragStart={() => { setDragId(item.id); setOverId(item.id) }}
          onDragEnd={() => { setDragId(null); setOverId(null) }}
          title="Arrastra para reordenar"
          aria-label="Arrastrar para reordenar"
        >⠿</span>

        {/* Toggle enabled */}
        <Toggle
          value={item.enabled}
          onChange={() => patchItem(item.id, { enabled: !item.enabled })}
        />

        {/* Label */}
        <input
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={(e) => e.key === 'Enter' && saveLabel()}
          className="font-brand text-sm text-brand-primary border border-transparent hover:border-gray-200 focus:border-brand-primary rounded-lg px-2 py-1 w-36 focus:outline-none transition-colors"
          placeholder="Etiqueta"
        />

        {/* Href */}
        <input
          type="text"
          value={editHref}
          onChange={(e) => setEditHref(e.target.value)}
          onBlur={saveHref}
          onKeyDown={(e) => e.key === 'Enter' && saveHref()}
          className="font-brand text-sm text-brand-primary/60 border border-transparent hover:border-gray-200 focus:border-brand-primary rounded-lg px-2 py-1 flex-1 focus:outline-none transition-colors"
          placeholder="/ruta"
        />

        {/* Saving indicator */}
        {isSaving && (
          <span className="font-brand text-xs text-brand-primary/40 animate-pulse">guardando…</span>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => deleteItem(item.id)}
          aria-label="Eliminar"
          className="text-brand-primary/20 hover:text-red-500 transition-colors text-xl leading-none px-1 flex-shrink-0"
        >
          ×
        </button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-brand text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Item list */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="w-4" />
          <span className="w-9" />
          <span className="font-brand text-xs font-semibold text-brand-primary/50 w-36">Etiqueta</span>
          <span className="font-brand text-xs font-semibold text-brand-primary/50 flex-1">Ruta</span>
          <span className="w-8" />
        </div>

        {tree.length === 0 && (
          <div className="px-4 py-8 text-center font-brand text-sm text-brand-primary/30">
            No hay ítems de navegación. Agrega uno abajo.
          </div>
        )}

        {tree.map((parent) => (
          <div key={parent.id}>
            <ItemRow item={parent} />
            {parent.children.map((child) => (
              <ItemRow key={child.id} item={child} indent />
            ))}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="border border-gray-200 rounded-2xl p-4 space-y-4 bg-white">
          <p className="font-brand text-sm font-semibold text-brand-primary">Nuevo ítem</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Etiqueta</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="ej: Blog"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Ruta</label>
              <input
                type="text"
                value={newHref}
                onChange={(e) => setNewHref(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="/blog"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">
              Ítem padre{' '}
              <span className="text-brand-primary/30">(dejar vacío para ítem de primer nivel)</span>
            </label>
            <select
              value={newParentId ?? ''}
              onChange={(e) => setNewParentId(e.target.value ? Number(e.target.value) : null)}
              className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="">— Primer nivel —</option>
              {topLevel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addItem}
              disabled={adding || !newLabel.trim()}
              className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40"
            >
              {adding ? 'Agregando…' : 'Agregar'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewLabel(''); setNewHref('/'); setNewParentId(null) }}
              className="font-brand text-sm text-brand-primary/40 hover:text-brand-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 font-brand text-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
        >
          <span className="text-lg leading-none">+</span> Agregar ítem
        </button>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="font-brand text-xs text-brand-primary/40">
          Los toggles de <strong>Carrito</strong> y <strong>Acceso</strong> se configuran en{' '}
          <a href="/configuracion/general" className="underline hover:text-brand-primary transition-colors">
            Configuración → General
          </a>
          .
        </p>
      </div>
    </div>
  )
}
