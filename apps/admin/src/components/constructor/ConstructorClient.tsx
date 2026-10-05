'use client'

/**
 * ConstructorClient — Constructor de páginas schema-driven (HU-218.3, beta).
 *
 * Un solo editor para CUALQUIER página: lista sus secciones en orden, permite
 * agregar/reordenar/activar/eliminar bloques y editar cada uno con el
 * <SectionEditor> auto-generado. Toda la persistencia usa el CMS API genérico
 * (`/api/admin/cms/sections`), ya acotado por tenant vía RLS. Convive con el
 * editor actual (`/contenido`) tras el flag `pageBuilder`.
 */
import { useCallback, useEffect, useState } from 'react'
import { listBlockTypes, getBlockSchema, listTemplates, getTemplateHomeLayout } from '@merkiai/database/blocks'
import SectionEditor from './SectionEditor'

interface PageOption { key: string; label: string; slug: string }
interface SectionRow {
  id: number
  page_key: string
  section_type: string
  enabled: boolean
  order_index: number
  settings?: unknown
  [k: string]: unknown
}

const api = '/api/admin/cms/sections'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

export default function ConstructorClient({ pages, initialPageKey, initialTemplate }: { pages: PageOption[]; initialPageKey: string; initialTemplate: string }) {
  const [pageKey, setPageKey] = useState(initialPageKey)
  const [template, setTemplate] = useState(initialTemplate)
  const [tplMsg, setTplMsg] = useState('')
  const [sections, setSections] = useState<SectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [adding, setAdding] = useState('')
  const [previewKey, setPreviewKey] = useState(Date.now()) // HU-219: bump → refresca iframe
  const [dragIdx, setDragIdx] = useState<number | null>(null) // HU-251 · DnD
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop') // HU-251 · preview

  const bump = useCallback(() => setPreviewKey(Date.now()), [])

  const load = useCallback(async (key: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${api}?page_key=${encodeURIComponent(key)}`)
      const data: SectionRow[] = res.ok ? await res.json() : []
      setSections([...data].sort((a, b) => a.order_index - b.order_index))
      setPreviewKey(Date.now()) // HU-219: refresca el preview tras cada cambio
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(pageKey) }, [pageKey, load])

  async function addBlock(type: string) {
    if (!type) return
    const nextOrder = sections.length ? Math.max(...sections.map((s) => s.order_index)) + 1 : 0
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_key: pageKey, section_type: type, order_index: nextOrder, enabled: true }),
    })
    setAdding('')
    await load(pageKey)
  }

  async function toggle(s: SectionRow) {
    await fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, enabled: !s.enabled }) })
    await load(pageKey)
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir
    if (other < 0 || other >= sections.length) return
    const a = sections[index], b = sections[other]
    await Promise.all([
      fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, order_index: b.order_index }) }),
      fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, order_index: a.order_index }) }),
    ])
    await load(pageKey)
  }

  async function remove(s: SectionRow) {
    if (!confirm(`¿Eliminar el bloque "${getBlockSchema(s.section_type)?.label ?? s.section_type}"?`)) return
    await fetch(`${api}?id=${s.id}`, { method: 'DELETE' })
    if (expanded === s.id) setExpanded(null)
    await load(pageKey)
  }

  // HU-251 · duplicar una sección (con sus ítems).
  async function duplicate(s: SectionRow) {
    await fetch('/api/admin/cms/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'sections', id: s.id }),
    })
    setTplMsg(`Bloque "${getBlockSchema(s.section_type)?.label ?? s.section_type}" duplicado ✓`) // HU-258 · anuncio a11y
    await load(pageKey)
  }

  // HU-251 · reordenar por arrastre: persiste order_index = posición para los cambiados.
  async function reorderTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return
    const next = [...sections]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSections(next) // optimista
    await Promise.all(
      next.map((s, i) => s.order_index === i
        ? null
        : fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, order_index: i }) }),
      ).filter(Boolean),
    )
    setTplMsg(`Bloque movido a la posición ${to + 1} de ${next.length} ✓`) // HU-258 · anuncio a11y
    await load(pageKey)
  }

  // HU-255 · importar una página desde un paquete .json → página nueva (borrador)
  async function importPageFile(file: File) {
    try {
      const pkg = JSON.parse(await file.text())
      const key = prompt('Key de la nueva página (a-z, 0-9, -, _):', '')?.trim().toLowerCase()
      if (!key) return
      const slug = prompt('Slug (URL) de la nueva página:', key)?.trim().toLowerCase()
      if (!slug) return
      const label = prompt('Nombre visible:', key) ?? key
      const res = await fetch('/api/admin/cms/page-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg, key, slug, label }),
      })
      if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo importar'); return }
      setTplMsg('Página importada como borrador ✓')
    } catch {
      setTplMsg('Archivo de página inválido')
    }
  }

  async function changeTemplate(next: string) {
    setTemplate(next); setTplMsg('')
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: next }),
    })
    setTplMsg(res.ok ? 'Plantilla actualizada ✓' : 'No se pudo actualizar la plantilla')
  }

  // HU-220: aplica el layout del template a la página home — crea los bloques
  // faltantes y ordena todo según el preset (no borra contenido existente).
  async function applyTemplate() {
    const layout = getTemplateHomeLayout(template)
    if (!confirm(`¿Aplicar la plantilla "${activeTpl?.label ?? template}" a esta página? Se crearán los bloques faltantes y se reordenarán según la plantilla. No se borra contenido.`)) return
    setTplMsg('Aplicando…')
    const byType = new Map(sections.map((s) => [s.section_type, s]))
    // Bloques del preset: reordenar los existentes y crear los faltantes.
    for (let i = 0; i < layout.length; i++) {
      const type = layout[i]
      const existing = byType.get(type)
      if (existing) {
        await fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, order_index: i }) })
      } else {
        await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page_key: pageKey, section_type: type, order_index: i, enabled: true }) })
      }
    }
    // Bloques fuera del preset: se empujan después, conservando su orden.
    let j = layout.length
    for (const s of sections) {
      if (!layout.includes(s.section_type)) {
        await fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, order_index: j++ }) })
      }
    }
    setTplMsg('Plantilla aplicada ✓')
    await load(pageKey)
  }

  const activeTpl = listTemplates().find((t) => t.name === template)
  const isHome = pageKey === 'home'
  const currentPage = pages.find((p) => p.key === pageKey)
  const previewPath = currentPage?.slug ? `/${currentPage.slug}` : '/'
  const previewSrc = SITE_URL ? `${SITE_URL}${previewPath}?preview=${previewKey}` : ''

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Plantilla de la tienda</label>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={template}
            onChange={(e) => changeTemplate(e.target.value)}
          >
            {listTemplates().map((t) => <option key={t.name} value={t.name}>{t.label}</option>)}
          </select>
          {isHome && (
            <button onClick={applyTemplate} className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
              Aplicar plantilla a esta página
            </button>
          )}
          <span role="status" aria-live="polite" className="text-sm text-green-600">{tplMsg}</span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={`/api/admin/cms/page-export?page_key=${encodeURIComponent(pageKey)}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Exportar página
            </a>
            <a
              href="/api/admin/preset-export"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              title="Empaqueta Tema + home como preset (JSON) para que el operador lo publique"
            >
              Exportar como preset
            </a>
            <a
              href="/api/admin/site-export"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              title="Backup del sitio completo (Tema + config + nav + páginas), sin secretos"
            >
              Backup del sitio
            </a>
            <label className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
              Importar página
              <input
                type="file" accept="application/json,.json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void importPageFile(f); e.target.value = '' }}
              />
            </label>
          </div>
        </div>
        {activeTpl?.description && <p className="mt-2 text-xs text-slate-500">{activeTpl.description}</p>}
      </div>

      {/* Editor (izquierda) + Vista previa en vivo (derecha) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-600">Página</label>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={pageKey}
              onChange={(e) => { setExpanded(null); setPageKey(e.target.value) }}
            >
              {pages.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={adding} onChange={(e) => setAdding(e.target.value)}>
                <option value="">Agregar bloque…</option>
                {listBlockTypes().map((b) => <option key={b.type} value={b.type}>{b.label}</option>)}
              </select>
              <button onClick={() => addBlock(adding)} disabled={!adding} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50">
                Agregar
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : sections.length === 0 ? (
            <p className="text-sm text-slate-500">Esta página no tiene bloques. Agrega uno para empezar.</p>
          ) : (
            <ul className="space-y-2">
              {sections.map((s, i) => {
                const schema = getBlockSchema(s.section_type)
                const open = expanded === s.id
                return (
                  <li
                    key={s.id}
                    className={`rounded-xl border bg-white ${dragIdx === i ? 'border-indigo-400 opacity-60' : 'border-slate-200'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) void reorderTo(dragIdx, i); setDragIdx(null) }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 select-none"
                        draggable
                        onDragStart={() => setDragIdx(i)}
                        onDragEnd={() => setDragIdx(null)}
                        title="Arrastra para reordenar"
                        aria-label="Arrastrar para reordenar"
                      >⠿</div>
                      <div className="flex flex-col">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none" aria-label="Subir bloque">▲</button>
                        <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none" aria-label="Bajar bloque">▼</button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{schema?.label ?? s.section_type}</p>
                        {schema?.description && <p className="text-xs text-slate-400">{schema.description}</p>}
                      </div>
                      <button onClick={() => toggle(s)} className={`rounded-full px-3 py-1 text-xs font-medium ${s.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.enabled ? 'Visible' : 'Oculto'}
                      </button>
                      <button onClick={() => setExpanded(open ? null : s.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {open ? 'Cerrar' : 'Editar'}
                      </button>
                      <button onClick={() => duplicate(s)} className="text-slate-400 hover:text-slate-700" title="Duplicar" aria-label="Duplicar bloque">⧉</button>
                      <button onClick={() => remove(s)} className="text-slate-400 hover:text-red-600" title="Eliminar" aria-label="Eliminar bloque">✕</button>
                    </div>
                    {open && (
                      <div className="border-t border-slate-100 px-4 py-4">
                        <SectionEditor section={s} onSaved={() => load(pageKey)} onChange={bump} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* HU-219: vista previa en vivo del storefront (refresca al guardar) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vista previa</h4>
            <div className="flex items-center gap-2">
              {/* HU-251 · toggle de dispositivo */}
              <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden" role="group" aria-label="Dispositivo de vista previa">
                {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={`px-2.5 py-1 text-xs font-medium ${device === d ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    aria-pressed={device === d}
                  >
                    {d === 'desktop' ? 'Escritorio' : d === 'tablet' ? 'Tablet' : 'Móvil'}
                  </button>
                ))}
              </div>
              <button onClick={bump} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Actualizar</button>
            </div>
          </div>
          {previewSrc ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex justify-center">
              <iframe
                key={previewKey}
                src={previewSrc}
                title="Vista previa de la tienda"
                className="h-[70vh] bg-white rounded-lg transition-all"
                style={{ width: device === 'desktop' ? '100%' : device === 'tablet' ? 768 : 390, maxWidth: '100%' }}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-400">
              Configura <code>NEXT_PUBLIC_SITE_URL</code> para ver la vista previa de la tienda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
