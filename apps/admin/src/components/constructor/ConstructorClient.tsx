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
import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getBlockSchema, listTemplates, getTemplateHomeLayout } from '@merkiai/database/blocks'
import { Icon, ConfirmDialog, PromptModal, WizardModal } from '@merkiai/ui'
import SectionEditor from './SectionEditor'
import AddBlockCatalog from './AddBlockCatalog'
import { getPreviewUrlAction } from '@/app/constructor/preview-action'

interface PageOption { key: string; label: string; slug: string; style?: unknown; page_type?: string; enabled?: boolean }

// HU-350 AC-2 · etiquetas de tipo de página para el filtro de la lista.
const PAGE_TYPE_LABELS: Record<string, string> = {
  landing: 'Landing', services: 'Servicios', about: 'Acerca de',
  faq: 'FAQ', content: 'Contenido', custom: 'Personalizada',
}
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

interface ConstructorFeatures { layoutAdvanced: boolean; pageStyle: boolean }

export default function ConstructorClient({
  pages, initialPageKey, initialTemplate,
  features = { layoutAdvanced: true, pageStyle: true },
}: {
  pages: PageOption[]; initialPageKey: string; initialTemplate: string
  features?: ConstructorFeatures
}) {
  const [pageKey, setPageKey] = useState(initialPageKey)
  // HU-350 · lista de páginas en estado local para poder crear/duplicar desde el
  // propio hub (crear+construir en un solo lugar) sin recargar.
  const [pageList, setPageList] = useState<PageOption[]>(pages)
  const [template, setTemplate] = useState(initialTemplate)
  const [tplMsg, setTplMsg] = useState('')
  const [sections, setSections] = useState<SectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [previewKey, setPreviewKey] = useState(Date.now()) // HU-219: bump → refresca iframe
  const [dragIdx, setDragIdx] = useState<number | null>(null) // HU-251 · DnD
  const [overIdx, setOverIdx] = useState<number | null>(null) // HU-126 · slot destino (efecto de desplazamiento)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop') // HU-251 · preview
  // HU-350 AC-2 · lista de páginas filtrable dentro del hub.
  const [pagePanel, setPagePanel] = useState(false)
  const [pageQuery, setPageQuery] = useState('')
  const [pageTypeF, setPageTypeF] = useState('')
  const [pageStatusF, setPageStatusF] = useState<'' | 'enabled' | 'draft'>('')

  // HU-358 · biblioteca de bloques guardados del tenant.
  const [savedBlocks, setSavedBlocks] = useState<{ id: number; label: string; section_type: string }[]>([])
  const loadSaved = useCallback(async () => {
    const res = await fetch('/api/admin/cms/saved-blocks')
    if (res.ok) setSavedBlocks(await res.json())
  }, [])
  useEffect(() => { void loadSaved() }, [loadSaved])

  // HU-364 · modales de marca (reemplazan prompt/confirm nativos).
  const [confirmState, setConfirmState] = useState<null | { title: string; message?: ReactNode; danger?: boolean; confirmLabel?: string; onConfirm: () => void }>(null)
  const [promptState, setPromptState] = useState<null | { title: string; fields: import('@merkiai/ui').PromptField[]; submitLabel?: string; validate?: (v: Record<string, string>) => string | null; onSubmit: (v: Record<string, string>) => void }>(null)
  const [newPage, setNewPage] = useState<null | { type: string; label: string; slug: string }>(null) // wizard Nueva página
  const [advOpen, setAdvOpen] = useState(false) // HU-365 · menú "···" de acciones avanzadas
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false) // HU-365 AC-3 · drawer Ajustes de página
  const askConfirm = (o: NonNullable<typeof confirmState>) => setConfirmState(o)
  const askPrompt = (o: NonNullable<typeof promptState>) => setPromptState(o)

  const bump = useCallback(() => setPreviewKey(Date.now()), [])

  // HU-350 AC-2 · tipos presentes en las páginas (para poblar el filtro).
  const pageTypesPresent = Array.from(new Set(pageList.map((p) => p.page_type ?? 'custom')))
  const filteredPages = pageList.filter((p) => {
    if (pageQuery && !`${p.label} ${p.slug} ${p.key}`.toLowerCase().includes(pageQuery.toLowerCase())) return false
    if (pageTypeF && (p.page_type ?? 'custom') !== pageTypeF) return false
    if (pageStatusF === 'enabled' && p.enabled === false) return false
    if (pageStatusF === 'draft' && p.enabled !== false) return false
    return true
  })
  function selectPage(key: string) { setExpanded(null); setPageKey(key); setPagePanel(false) }

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

  // HU-128 v3 · resuelve la URL de vista previa FIRMADA (token por-tenant) vía el
  // control plane. Se re-pide al cambiar de página o al pulsar "Actualizar".
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  useEffect(() => {
    const cp = pageList.find((p) => p.key === pageKey)
    const path = cp?.slug ? `/${cp.slug}` : '/'
    let cancelled = false
    getPreviewUrlAction(path).then((r) => {
      if (cancelled) return
      setPreviewUrl(r.url ?? null)
      setPreviewErr(r.error ?? null)
    })
    return () => { cancelled = true }
  }, [pageKey, previewKey, pageList])

  // HU-350 · crear una página nueva (cascarón) desde el hub → se abre el lienzo
  // en ella. Nace como BORRADOR (enabled=false): no se expone hasta publicar.
  function slugify(s: string) { return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }

  // HU-364 · "Nueva página" → wizard de marca (paso 1 tipo, paso 2 nombre/URL).
  function openNewPage() { setNewPage({ type: 'content', label: '', slug: '' }) }
  async function doCreatePage() {
    if (!newPage) return
    const label = newPage.label.trim()
    const slug = (newPage.slug.trim() || slugify(label)).replace(/^\//, '')
    const key = slugify(slug) || `pagina-${Date.now()}`
    const res = await fetch('/api/admin/cms/pages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, label, slug, page_type: newPage.type, enabled: false, show_in_footer: false }),
    })
    if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo crear la página'); return }
    setPageList((ps) => [...ps, { key, label, slug, page_type: newPage.type, enabled: false }])
    setExpanded(null); setPageKey(key); setNewPage(null)
    setTplMsg('Página creada (borrador). Agrega bloques y publícala cuando esté lista ✓')
  }

  // HU-350/364 · duplicar la página actual (modal de marca; export → import).
  function openDuplicate() {
    const current = pageList.find((p) => p.key === pageKey)
    askPrompt({
      title: 'Duplicar página',
      submitLabel: 'Duplicar',
      fields: [
        { key: 'label', label: 'Nombre de la copia', required: true, defaultValue: `${current?.label ?? pageKey} (copia)` },
        { key: 'slug', label: 'Slug (URL)', required: true, help: 'a-z, 0-9 y guiones' },
      ],
      validate: (v) => pageList.some((p) => p.key === (slugify(v.slug) || slugify(v.label))) ? 'Ya existe una página con esa clave.' : null,
      onSubmit: (v) => { setPromptState(null); void doDuplicate(v.label.trim(), v.slug.trim()) },
    })
  }
  async function doDuplicate(label: string, slugIn: string) {
    const base = slugify(slugIn) || slugify(label) || `${pageKey}-copia`
    const key = base
    try {
      const exp = await fetch(`/api/admin/cms/page-export?page_key=${encodeURIComponent(pageKey)}`)
      if (!exp.ok) { setTplMsg('No se pudo leer la página a duplicar'); return }
      const pkg = await exp.json()
      const res = await fetch('/api/admin/cms/page-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg, key, slug: base, label }),
      })
      if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo duplicar'); return }
      const src = pageList.find((p) => p.key === pageKey)
      setPageList((ps) => [...ps, { key, label, slug: base, page_type: src?.page_type ?? 'content', enabled: false }])
      setExpanded(null); setPageKey(key)
      setTplMsg('Página duplicada como borrador ✓')
    } catch {
      setTplMsg('No se pudo duplicar la página')
    }
  }

  // HU-375 · publicar / despublicar la página actual (pages.enabled).
  async function setPublished(enabled: boolean) {
    const res = await fetch('/api/admin/cms/pages', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: pageKey, enabled }),
    })
    if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo actualizar el estado'); return }
    setPageList((ps) => ps.map((p) => (p.key === pageKey ? { ...p, enabled } : p)))
    setTplMsg(enabled ? 'Página publicada ✓' : 'Página pasada a borrador ✓')
    bump()
  }
  function publishPage() { void setPublished(true) }
  function unpublishPage() {
    askConfirm({
      title: 'Pasar a borrador',
      message: 'La página dejará de ser visible en el sitio hasta que vuelvas a publicarla.',
      confirmLabel: 'Pasar a borrador',
      onConfirm: () => { setConfirmState(null); void setPublished(false) },
    })
  }

  async function addBlock(type: string) {
    if (!type) return
    const nextOrder = sections.length ? Math.max(...sections.map((s) => s.order_index)) + 1 : 0
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_key: pageKey, section_type: type, order_index: nextOrder, enabled: true }),
    })
    await load(pageKey)
  }

  // HU-358/364 · guardar una sección como bloque reutilizable (modal de marca).
  function saveBlock(s: SectionRow) {
    askPrompt({
      title: 'Guardar bloque',
      submitLabel: 'Guardar',
      fields: [{ key: 'label', label: 'Nombre del bloque guardado', required: true }],
      onSubmit: (v) => { setPromptState(null); void doSaveBlock(s, v.label.trim()) },
    })
  }
  async function doSaveBlock(s: SectionRow, label: string) {
    const res = await fetch('/api/admin/cms/saved-blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_id: s.id, label }),
    })
    if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo guardar el bloque'); return }
    setTplMsg('Bloque guardado ✓'); await loadSaved()
  }

  // HU-358 · insertar un bloque guardado como copia editable en la página actual.
  async function insertSavedBlock(id: number) {
    const nextOrder = sections.length ? Math.max(...sections.map((s) => s.order_index)) + 1 : 0
    const res = await fetch('/api/admin/cms/saved-blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insert_id: id, page_key: pageKey, order_index: nextOrder }),
    })
    if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo insertar'); return }
    setTplMsg('Bloque insertado ✓'); await load(pageKey)
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

  function remove(s: SectionRow) {
    askConfirm({
      title: 'Eliminar bloque',
      message: `¿Eliminar el bloque "${getBlockSchema(s.section_type)?.label ?? s.section_type}"? Esta acción no se puede deshacer.`,
      danger: true, confirmLabel: 'Eliminar',
      onConfirm: () => { setConfirmState(null); void doRemove(s) },
    })
  }
  async function doRemove(s: SectionRow) {
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
    let pkg: unknown
    try { pkg = JSON.parse(await file.text()) } catch { setTplMsg('Archivo de página inválido'); return }
    askPrompt({
      title: 'Importar página',
      submitLabel: 'Importar',
      fields: [
        { key: 'label', label: 'Nombre visible', required: true },
        { key: 'slug', label: 'Slug (URL)', required: true, help: 'a-z, 0-9 y guiones' },
      ],
      validate: (v) => pageList.some((p) => p.key === slugify(v.slug)) ? 'Ya existe una página con esa clave.' : null,
      onSubmit: (v) => { setPromptState(null); void doImportPage(pkg, v.label.trim(), v.slug.trim()) },
    })
  }
  async function doImportPage(pkg: unknown, label: string, slugIn: string) {
    const slug = slugify(slugIn)
    try {
      const res = await fetch('/api/admin/cms/page-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg, key: slug, slug, label }),
      })
      if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo importar'); return }
      setTplMsg('Página importada como borrador ✓')
    } catch {
      setTplMsg('No se pudo importar la página')
    }
  }

  // ── HU-351 · layout Filas/Columnas (picker) ───────────────────────────────
  const rid = (s: SectionRow) => (s.row_id as string | null | undefined) ?? null
  const rlayout = (s: SectionRow) => (s.row_layout as string | null | undefined) ?? null
  const cidx = (s: SectionRow) => (s.col_index as number | null | undefined) ?? 0
  const cellsOf = (rowId: string) => sections.filter((s) => rid(s) === rowId).sort((a, b) => cidx(a) - cidx(b))
  const equalPreset = (n: number) => (n === 2 ? '6,6' : n === 3 ? '4,4,4' : n === 4 ? '3,3,3,3' : '')
  const patchRow = (id: number, fields: Record<string, unknown>) =>
    fetch(api, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...fields }) })

  // Une el bloque `index` con el anterior en una misma fila (como combinar celdas).
  async function joinUp(index: number) {
    if (index <= 0) return
    const cur = sections[index], prev = sections[index - 1]
    let rowId = rid(prev)
    const ops: Promise<unknown>[] = []
    if (!rowId) {
      rowId = `r${prev.id}`
      ops.push(patchRow(prev.id, { row_id: rowId, col_index: 0, row_layout: '6,6' }))
      ops.push(patchRow(cur.id, { row_id: rowId, col_index: 1, row_layout: '6,6' }))
    } else {
      const cur_cells = cellsOf(rowId)
      const maxCol = cur_cells.length ? Math.max(...cur_cells.map(cidx)) : 0
      const eq = equalPreset(cur_cells.length + 1)
      ops.push(patchRow(cur.id, { row_id: rowId, col_index: maxCol + 1, row_layout: eq }))
      for (const c of cur_cells) ops.push(patchRow(c.id, { row_layout: eq }))
    }
    await Promise.all(ops)
    setTplMsg('Bloques unidos en una fila ✓')
    await load(pageKey)
  }

  // Saca el bloque de su fila (vuelve a ancho completo). Si queda 1 solo, también lo libera.
  async function splitCell(s: SectionRow) {
    const rowId = rid(s)
    await patchRow(s.id, { row_id: null, col_index: null, row_layout: null })
    if (rowId) {
      const remaining = cellsOf(rowId).filter((x) => x.id !== s.id)
      if (remaining.length === 1) await patchRow(remaining[0].id, { row_id: null, col_index: null, row_layout: null })
    }
    setTplMsg('Bloque separado de la fila ✓')
    await load(pageKey)
  }

  async function setRowLayout(s: SectionRow, preset: string) {
    const rowId = rid(s)
    if (!rowId) return
    await Promise.all(cellsOf(rowId).map((x) => patchRow(x.id, { row_layout: preset })))
    setTplMsg('Proporciones de la fila actualizadas ✓')
    await load(pageKey)
  }

  // HU-351 responsive fino · visibilidad por breakpoint (opt-in, en `settings`).
  const sSettings = (s: SectionRow) => (s.settings && typeof s.settings === 'object' ? s.settings : {}) as Record<string, unknown>
  async function toggleSectionVisibility(s: SectionRow, key: 'hideMobile' | 'hideDesktop') {
    const settings = { ...sSettings(s) }
    if (settings[key]) delete settings[key]; else settings[key] = true
    await patchRow(s.id, { settings })
    setTplMsg('Visibilidad del bloque actualizada ✓')
    await load(pageKey)
  }

  // HU-352 · estilo por página (override sobre el tema). Guarda en pages.style.
  // Genérico: `prop` ∈ {accent, container, space}; valor vacío/null borra la clave.
  async function setPageStyleProp(prop: 'accent' | 'container' | 'space', value: string | null, okMsg: string) {
    const cur = pageList.find((p) => p.key === pageKey)
    const style: Record<string, unknown> = { ...((cur?.style as Record<string, unknown>) ?? {}) }
    if (value) style[prop] = value; else delete style[prop]
    const res = await fetch('/api/admin/cms/pages', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: pageKey, style }),
    })
    if (!res.ok) { setTplMsg((await res.json().catch(() => ({}))).error || 'No se pudo actualizar el estilo'); return }
    setPageList((ps) => ps.map((p) => (p.key === pageKey ? { ...p, style } : p)))
    setTplMsg(okMsg)
    bump()
  }
  const setPageAccent = (accent: string | null) =>
    setPageStyleProp('accent', accent, accent ? 'Acento de la página actualizado ✓' : 'Acento de la página quitado ✓')

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
  function applyTemplate() {
    askConfirm({
      title: 'Aplicar plantilla',
      message: `¿Aplicar la plantilla "${activeTpl?.label ?? template}" a esta página? Se crearán los bloques faltantes y se reordenarán según la plantilla. No se borra contenido.`,
      confirmLabel: 'Aplicar',
      onConfirm: () => { setConfirmState(null); void doApplyTemplate() },
    })
  }
  async function doApplyTemplate() {
    const layout = getTemplateHomeLayout(template)
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
          {/* HU-365 · acciones avanzadas (exportar/importar/backup) en menú "···" */}
          <div className="ml-auto relative">
            <button
              onClick={() => setAdvOpen((v) => !v)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              aria-haspopup="menu" aria-expanded={advOpen} title="Exportar, importar y copia de seguridad"
            >
              ··· Avanzado
            </button>
            {advOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAdvOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5" role="menu">
                  <a href={`/api/admin/cms/page-export?page_key=${encodeURIComponent(pageKey)}`} onClick={() => setAdvOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Exportar página</a>
                  <a href="/api/admin/preset-export" onClick={() => setAdvOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Empaqueta Tema + home como preset (JSON)">Exportar como preset</a>
                  <a href="/api/admin/site-export" onClick={() => setAdvOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Backup del sitio completo (sin secretos)">Backup del sitio</a>
                  <label className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                    Importar página
                    <input type="file" accept="application/json,.json" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; setAdvOpen(false); if (f) void importPageFile(f); e.target.value = '' }} />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
        {activeTpl?.description && <p className="mt-2 text-xs text-slate-500">{activeTpl.description}</p>}
      </div>

      {/* Editor (izquierda) + Vista previa en vivo (derecha) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-600">Página</label>
            {/* HU-350 AC-2 · selector con lista filtrable (tipo/estado) dentro del hub */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPagePanel((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                aria-haspopup="listbox" aria-expanded={pagePanel}
              >
                <span className={`w-2 h-2 rounded-full ${(pageList.find((p) => p.key === pageKey)?.enabled === false) ? 'bg-amber-400' : 'bg-green-400'}`} />
                <span className="font-medium text-slate-700">{pageList.find((p) => p.key === pageKey)?.label ?? pageKey}</span>
                <span className="text-slate-400">▾</span>
              </button>
              {pagePanel && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPagePanel(false)} aria-hidden="true" />
                  <div className="absolute left-0 top-full z-20 mt-1 w-80 rounded-xl border border-slate-200 bg-white shadow-lg p-3" role="listbox" aria-label="Páginas">
                    <input
                      type="text" value={pageQuery} onChange={(e) => setPageQuery(e.target.value)}
                      placeholder="Buscar página…" aria-label="Buscar página"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm mb-2"
                    />
                    <div className="flex gap-2 mb-2">
                      <select value={pageTypeF} onChange={(e) => setPageTypeF(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs" aria-label="Filtrar por tipo">
                        <option value="">Todos los tipos</option>
                        {pageTypesPresent.map((t) => <option key={t} value={t}>{PAGE_TYPE_LABELS[t] ?? t}</option>)}
                      </select>
                      <select value={pageStatusF} onChange={(e) => setPageStatusF(e.target.value as '' | 'enabled' | 'draft')} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs" aria-label="Filtrar por estado">
                        <option value="">Todos</option>
                        <option value="enabled">Publicadas</option>
                        <option value="draft">Borrador</option>
                      </select>
                    </div>
                    <ul className="max-h-72 overflow-y-auto -mx-1">
                      {filteredPages.length === 0 && <li className="px-2 py-3 text-xs text-slate-400 text-center">Sin páginas que coincidan</li>}
                      {filteredPages.map((p) => (
                        <li key={p.key}>
                          <button
                            type="button" role="option" aria-selected={p.key === pageKey}
                            onClick={() => selectPage(p.key)}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm ${p.key === pageKey ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.enabled === false ? 'bg-amber-400' : 'bg-green-400'}`} title={p.enabled === false ? 'Borrador' : 'Publicada'} />
                            <span className="flex-1 truncate">{p.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{PAGE_TYPE_LABELS[p.page_type ?? 'custom'] ?? p.page_type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
            {/* HU-350 · crear/duplicar página desde el hub */}
            <button onClick={openNewPage} className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">+ Nueva página</button>
            <button onClick={openDuplicate} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Duplicar</button>
            {/* HU-375 · estado de publicación + publicar/despublicar */}
            {(() => {
              const published = pageList.find((p) => p.key === pageKey)?.enabled !== false
              return (
                <span className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {published ? 'Publicada' : 'Borrador'}
                  </span>
                  {published
                    ? <button onClick={unpublishPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Pasar a borrador</button>
                    : <button onClick={publishPage} className="rounded-lg bg-brand-primary text-brand-cream px-3 py-2 text-sm hover:bg-brand-dark">Publicar</button>}
                </span>
              )
            })()}
            {/* HU-375 · autoguardado (cada cambio persiste en el acto) */}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400" title="Los cambios se guardan automáticamente">
              <Icon name="check" size={12} /> Autoguardado
            </span>
            {/* HU-365 · AC-3 · ajustes de página agrupados en un drawer */}
            {features.pageStyle && (
              <button onClick={() => setPageSettingsOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Ancho, espaciado y acento de esta página">
                <Icon name="settings" size={14} /> Ajustes de página
              </button>
            )}

            {/* HU-358 · insertar un bloque guardado */}
            {savedBlocks.length > 0 && (
              <label className="flex items-center gap-1 text-xs text-slate-600" title="Insertar un bloque guardado como copia">
                Bloque guardado
                <select
                  defaultValue=""
                  onChange={(e) => { const id = Number(e.target.value); if (id) { insertSavedBlock(id); e.currentTarget.value = '' } }}
                  className="h-7 rounded border border-slate-300 text-xs px-1" aria-label="Insertar bloque guardado"
                >
                  <option value="">Insertar…</option>
                  {savedBlocks.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </label>
            )}
            <div className="ml-auto">
              <AddBlockCatalog onAdd={addBlock} />
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
                // HU-351 · info de fila para el picker de columnas
                const myRow = rid(s)
                const rowCells = myRow ? cellsOf(myRow) : []
                const isFirstCell = myRow ? rowCells[0]?.id === s.id : false
                const presetOpts = rowCells.length === 2 ? ['6,6', '8,4', '4,8']
                  : rowCells.length === 3 ? ['4,4,4', '6,3,3', '3,6,3']
                  : rowCells.length === 4 ? ['3,3,3,3'] : []
                // HU-126 · efecto de desplazamiento: se abre un hueco (con línea
                // punteada) en el slot donde caería el bloque arrastrado. Para
                // arrastre hacia abajo el hueco va DEBAJO del ítem bajo el cursor;
                // hacia arriba, ENCIMA — coherente con la semántica de reorderTo.
                const dragging = dragIdx !== null
                const isDragged = dragIdx === i
                const gapAbove = dragging && overIdx === i && dragIdx! > i
                const gapBelow = dragging && overIdx === i && dragIdx! < i
                const Indicator = () => (
                  <li aria-hidden className="h-0.5 rounded-full bg-indigo-400 my-1 shadow-[0_0_0_3px_rgba(129,140,248,0.25)] transition-all" />
                )
                return (
                  <Fragment key={s.id}>
                    {gapAbove && <Indicator />}
                  <li
                    className={`rounded-xl border bg-white transition-all duration-150 ${isDragged ? 'border-indigo-400 opacity-40 scale-[0.99]' : 'border-slate-200'}`}
                    onDragOver={(e) => { e.preventDefault(); if (dragging && overIdx !== i) setOverIdx(i) }}
                    onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) void reorderTo(dragIdx, i); setDragIdx(null); setOverIdx(null) }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 select-none"
                        draggable
                        onDragStart={() => { setDragIdx(i); setOverIdx(i) }}
                        onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                        title="Arrastra para reordenar"
                        aria-label="Arrastrar para reordenar"
                      ><Icon name="grid" size={16} /></div>
                      <div className="flex flex-col">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none" aria-label="Subir bloque"><Icon name="chevron-right" size={14} className="-rotate-90" /></button>
                        <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30 leading-none" aria-label="Bajar bloque"><Icon name="chevron-right" size={14} className="rotate-90" /></button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{schema?.label ?? s.section_type}</p>
                        {schema?.description && <p className="text-xs text-slate-400">{schema.description}</p>}
                      </div>
                      {/* HU-351 · picker de Filas/Columnas (HU-359 · gated por layout_avanzado).
                          Si el plan no incluye layout avanzado pero el bloque YA está en una fila
                          (contenido previo), se muestra "Separar" para no dejarlo atrapado (AC-4). */}
                      {myRow ? (
                        <div className="flex items-center gap-1">
                          <span className="rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold px-2 py-0.5" title="Este bloque está en una fila de columnas">Fila · {rowCells.length} col</span>
                          {features.layoutAdvanced && isFirstCell && presetOpts.length > 0 && (
                            <select value={rlayout(s) ?? presetOpts[0]} onChange={(e) => setRowLayout(s, e.target.value)} className="rounded-lg border border-slate-300 px-1.5 py-1 text-[11px]" title="Proporciones de la fila" aria-label="Proporciones de la fila">
                              {presetOpts.map((p) => <option key={p} value={p}>{p.replace(/,/g, ' · ')}</option>)}
                            </select>
                          )}
                          <button onClick={() => splitCell(s)} className="text-[11px] text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg px-2 py-1" title="Sacar de la fila (ancho completo)">Separar</button>
                        </div>
                      ) : features.layoutAdvanced && i > 0 && (
                        <button onClick={() => joinUp(i)} className="text-[11px] text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1" title="Unir con el bloque de arriba en una fila de columnas">⬓ Unir ↑</button>
                      )}
                      {/* HU-351 responsive fino · ocultar por breakpoint (gated por layout_avanzado) */}
                      {features.layoutAdvanced && (
                      <div className="flex items-center gap-0.5" title="Visibilidad por dispositivo">
                        <button
                          onClick={() => toggleSectionVisibility(s, 'hideMobile')}
                          className={`rounded-lg border px-2 py-1 text-[11px] ${sSettings(s).hideMobile ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          title={sSettings(s).hideMobile ? 'Oculto en móvil — clic para mostrar' : 'Ocultar en móvil'}
                          aria-label="Alternar visibilidad en móvil" aria-pressed={!!sSettings(s).hideMobile}
                        >Móvil {sSettings(s).hideMobile ? '⃠' : ''}</button>
                        <button
                          onClick={() => toggleSectionVisibility(s, 'hideDesktop')}
                          className={`rounded-lg border px-2 py-1 text-[11px] ${sSettings(s).hideDesktop ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          title={sSettings(s).hideDesktop ? 'Oculto en escritorio — clic para mostrar' : 'Ocultar en escritorio'}
                          aria-label="Alternar visibilidad en escritorio" aria-pressed={!!sSettings(s).hideDesktop}
                        >Escritorio {sSettings(s).hideDesktop ? '⃠' : ''}</button>
                      </div>
                      )}
                      <button onClick={() => toggle(s)} className={`rounded-full px-3 py-1 text-xs font-medium ${s.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.enabled ? 'Visible' : 'Oculto'}
                      </button>
                      <button onClick={() => setExpanded(open ? null : s.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {open ? 'Cerrar' : 'Editar'}
                      </button>
                      <button onClick={() => duplicate(s)} className="text-slate-400 hover:text-slate-700" title="Duplicar" aria-label="Duplicar bloque"><Icon name="grid" size={15} /></button>
                      <button onClick={() => saveBlock(s)} className="text-[11px] text-slate-500 hover:text-indigo-700 border border-slate-200 rounded-lg px-2 py-1" title="Guardar como bloque reutilizable">Guardar</button>
                      <button onClick={() => remove(s)} className="text-slate-400 hover:text-red-600" title="Eliminar" aria-label="Eliminar bloque"><Icon name="trash" size={15} /></button>
                    </div>
                    {open && (
                      <div className="border-t border-slate-100 px-4 py-4">
                        <SectionEditor section={s} onSaved={() => load(pageKey)} onChange={bump} />
                      </div>
                    )}
                  </li>
                  {gapBelow && <Indicator />}
                  </Fragment>
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
          {previewUrl ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex justify-center">
                <iframe
                  key={`${previewKey}-${device}`}
                  src={previewUrl}
                  title="Vista previa de la tienda"
                  className="h-[70vh] bg-white rounded-lg transition-all"
                  style={{ width: device === 'desktop' ? '100%' : device === 'tablet' ? 768 : 390, maxWidth: '100%' }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                ¿No se ve? <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="underline">Ábrela en una pestaña nueva</a> (algunos dominios propios no permiten incrustar).
              </p>
            </>
          ) : previewErr ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
              No se pudo generar la vista previa: {previewErr}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-400">Cargando vista previa…</p>
          )}
        </div>
      </div>

      {/* HU-365 AC-3 · drawer "Ajustes de página" (agrupa ancho/espaciado/acento) */}
      {pageSettingsOpen && (() => {
        const st = (pageList.find((p) => p.key === pageKey)?.style as { accent?: string; container?: string; space?: string } | undefined) ?? {}
        const a = st.accent ?? ''
        return (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setPageSettingsOpen(false)}>
            <div className="w-80 max-w-full h-full bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-brand-primary text-lg">Ajustes de página</h3>
                <button onClick={() => setPageSettingsOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar"><Icon name="close" size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Acento <span className="font-normal text-slate-400">(en cascada sobre el tema)</span></label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={a || '#000000'} onChange={(e) => setPageAccent(e.target.value)} className="h-9 w-10 rounded border border-slate-300 p-0.5 cursor-pointer" aria-label="Acento de la página" />
                    {a && <button onClick={() => setPageAccent(null)} className="text-xs text-slate-400 hover:text-red-600">Quitar</button>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Ancho del contenedor</label>
                  <select value={st.container ?? ''} onChange={(e) => setPageStyleProp('container', e.target.value || null, 'Ancho de la página actualizado ✓')} className="w-full h-9 rounded-lg border border-slate-300 text-sm px-2">
                    <option value="">Tema</option>
                    <option value="sm">Estrecho</option>
                    <option value="md">Medio</option>
                    <option value="lg">Normal</option>
                    <option value="xl">Ancho</option>
                    <option value="full">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Escala de espaciado</label>
                  <select value={st.space ?? ''} onChange={(e) => setPageStyleProp('space', e.target.value || null, 'Espaciado de la página actualizado ✓')} className="w-full h-9 rounded-lg border border-slate-300 text-sm px-2">
                    <option value="">Tema</option>
                    <option value="compact">Compacto</option>
                    <option value="normal">Normal</option>
                    <option value="relaxed">Amplio</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">Más ajustes (tipo de página, SEO, navegación) llegarán al traer «Páginas» al Constructor.</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* HU-364 · modales de marca (reemplazan prompt/confirm/alert nativos) */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        message={confirmState?.message}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
      <PromptModal
        open={!!promptState}
        title={promptState?.title ?? ''}
        fields={promptState?.fields ?? []}
        submitLabel={promptState?.submitLabel}
        validate={promptState?.validate}
        onSubmit={(v) => promptState?.onSubmit(v)}
        onClose={() => setPromptState(null)}
      />
      {/* HU-364 · "Nueva página": wizard tipo → nombre/URL con validación en vivo */}
      <WizardModal
        open={!!newPage}
        title="Nueva página"
        onClose={() => setNewPage(null)}
        onFinish={() => void doCreatePage()}
        finishLabel="Crear página"
        steps={newPage ? [
          {
            title: 'Tipo',
            canAdvance: !!newPage.type,
            content: (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PAGE_TYPE_LABELS).map(([val, lbl]) => (
                  <button
                    key={val} type="button"
                    onClick={() => setNewPage((n) => n && ({ ...n, type: val }))}
                    className={`rounded-xl border p-3 text-left text-sm ${newPage.type === val ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >{lbl}</button>
                ))}
              </div>
            ),
          },
          {
            title: 'Nombre y URL',
            canAdvance: !!newPage.label.trim() && !pageList.some((p) => p.key === (slugify(newPage.slug) || slugify(newPage.label))),
            content: (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nombre de la página *</label>
                  <input autoFocus value={newPage.label} onChange={(e) => setNewPage((n) => n && ({ ...n, label: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Slug (URL)</label>
                  <input value={newPage.slug} onChange={(e) => setNewPage((n) => n && ({ ...n, slug: e.target.value }))}
                    placeholder={slugify(newPage.label) || 'mi-pagina'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-xs" />
                  <p className="text-[11px] text-slate-400 mt-0.5">Se usará /{slugify(newPage.slug) || slugify(newPage.label) || 'mi-pagina'}. Nace como borrador.</p>
                </div>
                {pageList.some((p) => p.key === (slugify(newPage.slug) || slugify(newPage.label))) && newPage.label.trim() && (
                  <p className="text-xs text-red-500">Ya existe una página con esa clave.</p>
                )}
              </div>
            ),
          },
        ] : []}
      />
    </div>
  )
}
