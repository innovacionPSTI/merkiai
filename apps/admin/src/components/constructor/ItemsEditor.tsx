'use client'

/**
 * ItemsEditor — gestiona los ítems repetibles (section_items) de una sección
 * schema-driven (HU-218.3b): Hero (slides), Servicios, Cards, FAQ, Testimonios.
 * Un formulario por ítem auto-generado desde `schema.items.fields`; persiste vía
 * el CMS API genérico (`/api/admin/cms/items`), ya acotado por tenant vía RLS.
 */
import { useCallback, useEffect, useState } from 'react'
import { getBlockSchema } from '@merkiai/database/blocks'
import { Icon } from '@merkiai/ui'
import { splitItemFields, resolveItemFields, itemTypeOf } from '@/lib/item-fields'
import FieldInput from './FieldInput'

interface ItemRow {
  id: number
  item_type: string
  enabled: boolean
  order_index: number
  metadata?: unknown
  /** HU-128 v2: overlay de borrador (invisible al público). */
  draft?: unknown
  [k: string]: unknown
}

const api = '/api/admin/cms/items'
const draftApi = '/api/admin/cms/draft'

/** Overlay de borrador del ítem como objeto (o null). */
function itemDraft(it: ItemRow): Record<string, unknown> | null {
  return it.draft && typeof it.draft === 'object' ? (it.draft as Record<string, unknown>) : null
}

export default function ItemsEditor({ sectionId, sectionType, published = false, onChange }: { sectionId: number; sectionType: string; published?: boolean; onChange?: () => void }) {
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
      // HU-128 v2: si hay overlay de borrador, el formulario arranca mostrándolo.
      setDraft(Object.fromEntries(sorted.map((it) => {
        const d = itemDraft(it)
        return [it.id, resolveItemFields(sectionType, d ? { ...it, ...d } : it)]
      })))
    } finally {
      setLoading(false)
    }
  }, [sectionId, sectionType])

  // Refresca el preview del Constructor tras cargar/mutar ítems.
  useEffect(() => { onChange?.() }, [items, onChange])

  useEffect(() => { void load() }, [load])

  async function addItem() {
    if (!itemType) return
    const nextOrder = items.length ? Math.max(...items.map((i) => i.order_index)) + 1 : 0
    // HU-128 v2: en una sección publicada, el ítem nuevo nace oculto (enabled=false)
    // para no exponerlo; se ve en la vista previa y se publica al activarlo.
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_id: sectionId, item_type: itemType, order_index: nextOrder, enabled: !published }),
    })
    await load()
  }

  async function saveItem(it: ItemRow) {
    const values = draft[it.id] ?? {}
    const prevMeta = (it.metadata ?? {}) as Record<string, unknown>
    const { columns, metadata } = splitItemFields(sectionType, values, prevMeta)
    let res: Response
    if (published && it.enabled) {
      // Editar en caliente → al borrador (invisible para el público).
      res = await fetch(draftApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'items', id: it.id, action: 'save', patch: { ...columns, metadata } }),
      })
    } else {
      // Ítem oculto o sección no publicada → se escribe en vivo (no es visible).
      res = await fetch(api, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: it.id, ...columns, metadata }),
      })
    }
    const ok = res.ok
    const text = ok ? (published && it.enabled ? 'Guardado en borrador ✓' : 'Guardado ✓') : `Error: ${(await res.json().catch(() => ({}))).error ?? ''}`
    setMsg((m) => ({ ...m, [it.id]: text }))
    if (ok) await load()
  }

  async function draftAction(it: ItemRow, action: 'publish' | 'discard') {
    const res = await fetch(draftApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'items', id: it.id, action }),
    })
    setMsg((m) => ({ ...m, [it.id]: res.ok ? (action === 'publish' ? 'Publicado ✓' : 'Descartado') : 'Error' }))
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

  // HU-251 · duplicar ítem
  async function duplicate(it: ItemRow) {
    await fetch('/api/admin/cms/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'items', id: it.id }),
    })
    await load()
  }

  const label = schema?.items?.labelPlural ?? 'Ítems'
  const labelOne = schema?.items?.label ?? 'Ítem'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <Icon name="list" size={13} /> Contenido · {label}
          {items.length > 0 && <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-medium text-slate-500">{items.length}</span>}
        </h4>
        <button onClick={addItem} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Icon name="plus" size={13} /> Agregar {labelOne.toLowerCase()}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">Sin {label.toLowerCase()}. Agrega el primero.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={it.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none" aria-label="Subir">
                    <Icon name="chevron-right" size={13} className="-rotate-90" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none" aria-label="Bajar">
                    <Icon name="chevron-right" size={13} className="rotate-90" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-slate-600">{labelOne} #{i + 1}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => toggle(it)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${it.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {it.enabled ? 'Visible' : 'Oculto'}
                  </button>
                  <button onClick={() => duplicate(it)} className="text-slate-400 hover:text-slate-700" title="Duplicar" aria-label="Duplicar ítem"><Icon name="grid" size={14} /></button>
                  <button onClick={() => remove(it)} className="text-slate-400 hover:text-red-600" title="Eliminar" aria-label="Eliminar ítem"><Icon name="trash" size={14} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
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

              <div className="flex flex-wrap items-center gap-3 px-3 pb-3">
                <button onClick={() => saveItem(it)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                  {published && it.enabled ? 'Guardar borrador' : 'Guardar'}
                </button>
                {itemDraft(it) && (
                  <>
                    <button onClick={() => draftAction(it, 'publish')} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Publicar cambios</button>
                    <button onClick={() => draftAction(it, 'discard')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">Descartar</button>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">Borrador sin publicar</span>
                  </>
                )}
                <span role="status" aria-live="polite" className={`text-xs ${msg[it.id]?.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg[it.id] ?? ''}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
