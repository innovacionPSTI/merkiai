'use client'

/**
 * ColeccionesClient — gestor de colecciones (HU-353).
 * Dos planos: editor del TIPO (campos del esquema) + CRUD de REGISTROS, con el
 * formulario de registro generado a partir del esquema. Persiste vía el API
 * scoped (`/api/admin/cms/collections` y `/collection-items`). Genérico.
 */
import { useCallback, useEffect, useState } from 'react'
import type { Collection, CollectionField, CollectionFieldType, CollectionItem } from '@merkiai/database'
import { COLLECTION_FIELD_TYPES } from '@merkiai/database'

const TYPE_LABELS: Record<CollectionFieldType, string> = {
  text: 'Texto', textarea: 'Texto largo', richtext: 'Texto enriquecido', number: 'Número',
  boolean: 'Sí/No', date: 'Fecha', image: 'Imagen', file: 'Archivo', url: 'URL',
  select: 'Selección', relation: 'Relación',
}

export default function ColeccionesClient({ initialCollections }: { initialCollections: Collection[] }) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [sel, setSel] = useState<string | null>(initialCollections[0]?.key ?? null)
  const [tab, setTab] = useState<'campos' | 'registros'>('campos')
  const [msg, setMsg] = useState('')
  const current = collections.find((c) => c.key === sel) ?? null

  // ── Colecciones ──────────────────────────────────────────────────────────
  async function createCollection() {
    const label = prompt('Nombre de la colección (p. ej. Noticias):')?.trim()
    if (!label) return
    const key = prompt('Clave (slug, p. ej. noticias):', label.toLowerCase().replace(/[^a-z0-9]+/g, '-'))?.trim()
    if (!key) return
    const res = await fetch('/api/admin/cms/collections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, label, fields: [] }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error || 'No se pudo crear'); return }
    setCollections((cs) => [...cs, data]); setSel(data.key); setTab('campos'); setMsg('Colección creada ✓')
  }

  async function saveFields(fields: CollectionField[]) {
    if (!current) return
    const res = await fetch('/api/admin/cms/collections', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: current.key, fields }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error || 'No se pudo guardar'); return }
    setCollections((cs) => cs.map((c) => (c.key === current.key ? data : c))); setMsg('Campos guardados ✓')
  }

  async function removeCollection() {
    if (!current || !confirm(`¿Eliminar la colección "${current.label}" y sus registros?`)) return
    const res = await fetch(`/api/admin/cms/collections?key=${encodeURIComponent(current.key)}`, { method: 'DELETE' })
    if (!res.ok) { setMsg('No se pudo eliminar'); return }
    setCollections((cs) => cs.filter((c) => c.key !== current.key)); setSel(null); setMsg('Colección eliminada ✓')
  }

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-64 flex-shrink-0 border-r border-gray-100 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-brand text-xs font-semibold text-brand-primary/50 uppercase tracking-wide">Tipos</p>
          <button onClick={createCollection} className="text-xs text-indigo-600 hover:text-indigo-800">+ Nueva</button>
        </div>
        <div className="space-y-1">
          {collections.map((c) => (
            <button key={c.key} onClick={() => { setSel(c.key); setTab('campos') }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm ${sel === c.key ? 'bg-brand-primary text-brand-cream' : 'hover:bg-gray-50 text-brand-primary/70'}`}>
              {c.label}
              <span className="block text-[11px] opacity-60">/{c.key} · {c.fields.length} campos</span>
            </button>
          ))}
          {collections.length === 0 && <p className="text-xs text-slate-400 py-6 text-center">Sin colecciones aún.</p>}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {msg && <div className="mb-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">{msg}</div>}
        {!current ? (
          <p className="text-slate-400 text-sm">Selecciona o crea una colección.</p>
        ) : (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-brand-primary">{current.label}</h2>
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-slate-200 overflow-hidden text-sm">
                  <button onClick={() => setTab('campos')} className={`px-3 py-1.5 ${tab === 'campos' ? 'bg-brand-primary text-brand-cream' : 'text-slate-600'}`}>Campos</button>
                  <button onClick={() => setTab('registros')} className={`px-3 py-1.5 ${tab === 'registros' ? 'bg-brand-primary text-brand-cream' : 'text-slate-600'}`}>Registros</button>
                </div>
                <button onClick={removeCollection} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
              </div>
            </div>
            {tab === 'campos'
              ? <FieldsEditor key={current.key} fields={current.fields} onSave={saveFields} />
              : <RecordsManager key={current.key} collection={current} onError={setMsg} />}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Editor del esquema de campos ─────────────────────────────────────────────
function FieldsEditor({ fields, onSave }: { fields: CollectionField[]; onSave: (f: CollectionField[]) => void }) {
  const [list, setList] = useState<CollectionField[]>(fields)
  const update = (i: number, patch: Partial<CollectionField>) => setList((l) => l.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  const add = () => setList((l) => [...l, { key: `campo_${l.length + 1}`, label: `Campo ${l.length + 1}`, type: 'text' }])
  const remove = (i: number) => setList((l) => l.filter((_, j) => j !== i))

  return (
    <div className="space-y-3">
      {list.map((f, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <input value={f.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Etiqueta"
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-[140px]" />
          <input value={f.key} onChange={(e) => update(i, { key: e.target.value })} placeholder="clave"
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-32 font-mono text-xs" />
          <select value={f.type} onChange={(e) => update(i, { type: e.target.value as CollectionFieldType })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
            {COLLECTION_FIELD_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} /> Obligatorio
          </label>
          {f.type === 'select' && (
            <input
              value={(f.options ?? []).map((o) => o.value).join(', ')}
              onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean).map((v) => ({ value: v, label: v })) })}
              placeholder="opciones separadas por coma"
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-full" />
          )}
          {f.type === 'relation' && (
            <input value={f.relationTo ?? ''} onChange={(e) => update(i, { relationTo: e.target.value })}
              placeholder="colección relacionada (clave)" className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-56" />
          )}
          <button onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 ml-auto">✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={add} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">+ Agregar campo</button>
        <button onClick={() => onSave(list)} className="rounded-lg bg-brand-primary text-brand-cream px-4 py-2 text-sm hover:bg-brand-dark">Guardar esquema</button>
      </div>
    </div>
  )
}

// ── Gestor de registros ──────────────────────────────────────────────────────
function RecordsManager({ collection, onError }: { collection: Collection; onError: (m: string) => void }) {
  const [items, setItems] = useState<CollectionItem[]>([])
  const [editing, setEditing] = useState<CollectionItem | 'new' | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/cms/collection-items?collection_key=${encodeURIComponent(collection.key)}`)
    if (res.ok) setItems(await res.json())
  }, [collection.key])
  useEffect(() => { void load() }, [load])

  async function save(form: Record<string, unknown>, status: 'draft' | 'published', id?: number) {
    const method = id ? 'PATCH' : 'POST'
    const body = id
      ? { id, collection_key: collection.key, data: form, status }
      : { collection_key: collection.key, data: form, status }
    const res = await fetch('/api/admin/cms/collection-items', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { onError((data.details?.[0]) || data.error || 'No se pudo guardar'); return }
    setEditing(null); onError(''); await load()
  }
  async function remove(id: number) {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/admin/cms/collection-items?id=${id}`, { method: 'DELETE' }); await load()
  }

  if (collection.fields.length === 0) {
    return <p className="text-sm text-slate-400">Define primero los campos de esta colección en la pestaña «Campos».</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setEditing('new')} className="rounded-lg bg-brand-primary text-brand-cream px-4 py-2 text-sm hover:bg-brand-dark">+ Nuevo registro</button>
      </div>
      {editing !== null && (
        <RecordForm
          fields={collection.fields}
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={(form, status) => save(form, status, editing === 'new' ? undefined : editing.id)}
        />
      )}
      <div className="space-y-1">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <span className={`w-2 h-2 rounded-full ${it.status === 'published' ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span className="text-sm flex-1 truncate">{it.title || it.slug}</span>
            <span className="text-[11px] text-slate-400">/{it.slug}</span>
            <button onClick={() => setEditing(it)} className="text-xs text-indigo-600 hover:text-indigo-800">Editar</button>
            <button onClick={() => remove(it.id)} className="text-slate-300 hover:text-red-500">✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Sin registros aún.</p>}
      </div>
    </div>
  )
}

function RecordForm({ fields, initial, onCancel, onSave }: {
  fields: CollectionField[]; initial: CollectionItem | null
  onCancel: () => void; onSave: (form: Record<string, unknown>, status: 'draft' | 'published') => void
}) {
  const [form, setForm] = useState<Record<string, unknown>>(() => ({ ...(initial?.data ?? {}) }))
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-semibold text-brand-primary/50 mb-1">{f.label}{f.required ? ' *' : ''}</label>
          {f.type === 'textarea' || f.type === 'richtext' ? (
            <textarea value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} rows={3}
              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm resize-none" />
          ) : f.type === 'boolean' ? (
            <input type="checkbox" checked={form[f.key] === true} onChange={(e) => set(f.key, e.target.checked)} />
          ) : f.type === 'number' ? (
            <input type="number" value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
          ) : f.type === 'date' ? (
            <input type="date" value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
          ) : f.type === 'select' ? (
            <select value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
              <option value="">—</option>
              {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type="text" value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.type === 'image' || f.type === 'file' ? 'URL del archivo' : f.type === 'relation' ? 'slug relacionado' : ''}
              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
          )}
          {f.help && <p className="text-[11px] text-slate-400 mt-0.5">{f.help}</p>}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form, 'published')} className="rounded-lg bg-brand-primary text-brand-cream px-4 py-2 text-sm hover:bg-brand-dark">Publicar</button>
        <button onClick={() => onSave(form, 'draft')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Guardar borrador</button>
        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600 px-2">Cancelar</button>
      </div>
    </div>
  )
}
