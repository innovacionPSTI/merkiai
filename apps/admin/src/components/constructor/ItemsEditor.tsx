'use client'

/**
 * ItemsEditor — gestiona los ítems repetibles (section_items) de una sección
 * schema-driven (HU-218.3b): Hero (slides), Servicios, Cards, FAQ, Testimonios.
 * Un formulario por ítem auto-generado desde `schema.items.fields`; persiste vía
 * el CMS API genérico (`/api/admin/cms/items`), ya acotado por tenant vía RLS.
 */
import { useCallback, useEffect, useState } from 'react'
import { getBlockSchema } from '@merkiai/database'
import { splitItemFields, resolveItemFields, itemTypeOf } from '@/lib/item-fields'
import FieldInput from './FieldInput'

interface ItemRow {
  id: number
  item_type: string
  enabled: boolean
  order_index: number
  metadata?: unknown
  [k: string]: unknown
}

const api = '/api/admin/cms/items'

export default function ItemsEditor({ sectionId, sectionType }: { sectionId: number; sectionType: string }) {
  const schema = getBlockSchema(sectionType)
  const itemType = itemTypeOf(sectionType)
  const fieldDefs = schema?.items ? Object.entries(schema.items.fields) : []

  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Record<number, Record<string, unknown>>>({})
  const [msg, setMsg] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${api}?section_id=${sectionId}`)
      const data: ItemRow[] = res.ok ? await res.json() : []
      const sorted = [...data].sort((a, b) => a.order_index - b.order_index)
      setItems(sorted)
      setDraft(Object.fromEntries(sorted.map((it) => [it.id, resolveItemFields(sectionType, it)])))
    } finally {
      setLoading(false)
    }
  }, [sectionId, sectionType])

  useEffect(() => { void load() }, [load])

  async function addItem() {
    if (!itemType) return
    const nextOrder = items.length ? Math.max(...items.map((i) => i.order_index)) + 1 : 0
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_id: sectionId, item_type: itemType, order_index: nextOrder, enabled: true }),
    })
    await load()
  }

  async function saveItem(it: ItemRow) {
    const values = draft[it.id] ?? {}
    const prevMeta = (it.metadata ?? {}) as Record<string, unknown>
    const { columns, metadata } = splitItemFields(sectionType, values, prevMeta)
    const res = await fetch(api, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, ...columns, metadata }),
    })
    const text = res.ok ? 'Guardado ✓' : `Error: ${(await res.json().catch(() => ({}))).error ?? ''}`
    setMsg((m) => ({ ...m, [it.id]: text }))
    if (res.ok) await load()
  }

  async function toggle(it: ItemRow) {
    await fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, enabled: !it.enabled }) })
    await load()
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir
    if (other < 0 || other >= items.length) return
    const a = items[index], b = items[other]
    await Promise.all([
      fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, order_index: b.order_index }) }),
      fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, order_index: a.order_index }) }),
    ])
    await load()
  }

  async function remove(it: ItemRow) {
    if (!confirm('¿Eliminar este ítem?')) return
    await fetch(`${api}?id=${it.id}`, { method: 'DELETE' })
    await load()
  }

  const label = schema?.items?.labelPlural ?? 'Ítems'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h4>
        <button onClick={addItem} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">+ Agregar</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">Sin {label.toLowerCase()}. Agrega el primero.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={it.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none">▼</button>
                </div>
                <span className="text-xs font-medium text-slate-500">#{i + 1}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => toggle(it)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${it.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {it.enabled ? 'Visible' : 'Oculto'}
                  </button>
                  <button onClick={() => remove(it)} className="text-slate-400 hover:text-red-600" title="Eliminar">✕</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fieldDefs.map(([key, field]) => (
                  <div key={key} className={field.type === 'textarea' || field.type === 'richtext' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">{field.label}</label>
                    <FieldInput
                      name={`${it.id}-${key}`}
                      field={field}
                      value={draft[it.id]?.[key]}
                      onChange={(v) => setDraft((d) => ({ ...d, [it.id]: { ...d[it.id], [key]: v } }))}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => saveItem(it)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">Guardar</button>
                {msg[it.id] && <span className={`text-xs ${msg[it.id].startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg[it.id]}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
