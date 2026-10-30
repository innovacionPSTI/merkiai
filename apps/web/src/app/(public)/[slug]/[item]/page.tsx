/**
 * HU-354 · Ruta dinámica de registros de colección: /[slug]/[item]
 * (slug = clave de la colección, item = slug del registro).
 *
 * Reusa el nombre de segmento `[slug]` del CMS (Next no permite dos nombres
 * dinámicos distintos en el mismo nivel) y anida `[item]`. Resuelve la colección
 * (habilitada) y el registro (publicado; en preview también borradores) y lo
 * renderiza con una PLANTILLA genérica dirigida por el esquema de campos. Las
 * rutas literales de dos segmentos (blog/, shop/, bundles/) tienen prioridad.
 * No toca páginas estáticas: tipo/ruta nuevo (cero regresión). Genérico.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getCollection, getCollectionItemBySlug, getPageWithSections,
  recordTokens, applyTokensDeep, type CollectionField,
} from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import { getMachineDb } from '@/lib/machine-db'
import { isPreviewMode } from '@/lib/preview'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import SectionRenderer from '@/components/sections/SectionRenderer'
import { groupSectionsIntoRows, cellSpanClass, cellResponsiveClasses } from '@/lib/section-rows'
import PreviewBanner from '@/components/PreviewBanner'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string; item: string }> }

function firstByType(fields: CollectionField[], data: Record<string, unknown>, types: string[]): { field: CollectionField; value: string } | null {
  for (const f of fields) {
    if (types.includes(f.type)) {
      const v = data[f.key]
      if (typeof v === 'string' && v.trim()) return { field: f, value: v }
    }
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, item } = await params
  const db = await getRequestCatalogDb()
  const coll = await getCollection(slug, db).catch(() => null)
  if (!coll) return {}
  const rec = await getCollectionItemBySlug(slug, item, db, true).catch(() => null)
  if (!rec) return {}
  const desc = firstByType(coll.fields, rec.data, ['textarea', 'richtext', 'text'])?.value
  const image = firstByType(coll.fields, rec.data, ['image'])?.value
  return {
    title: rec.title ?? item,
    description: desc ? desc.slice(0, 160) : undefined,
    openGraph: {
      title: rec.title ?? item,
      description: desc ? desc.slice(0, 160) : undefined,
      images: image ? [{ url: image }] : undefined,
    },
  }
}

function formatDate(v: string): string {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function CollectionItemPage({ params }: Props) {
  const { slug, item } = await params
  const preview = await isPreviewMode()
  const ctx = await getStoreContext().catch(() => null)
  if (!ctx) notFound()

  const db = preview ? getMachineDb(ctx.tenantId) : ctx.db
  const coll = await getCollection(slug, db).catch(() => null)
  if (!coll) notFound()
  const rec = await getCollectionItemBySlug(slug, item, db, !preview).catch(() => null)
  if (!rec) notFound()

  // HU-354 AC-1 · si la colección tiene plantilla (página CMS), se renderiza esa
  // página sustituyendo los placeholders {{campo}} con los valores del registro.
  // La plantilla se lee con cliente-máquina (tenant-scoped) para no depender de
  // que la propia página esté publicada. Fallback: plantilla automática.
  if (coll.template_page_key) {
    const tplDb = getMachineDb(ctx.tenantId)
    const tpl = await getPageWithSections(coll.template_page_key, false, tplDb).catch(() => null)
    if (tpl && tpl.sections.length > 0) {
      const tokens = recordTokens(rec)
      const sections = tpl.sections.map((s) => applyTokensDeep(s, tokens))
      return (
        <div className="bg-brand-cream min-h-screen pt-16">
          {preview && <PreviewBanner />}
          {groupSectionsIntoRows(sections).map((row, ri) => {
            if (row.single) {
              const s = row.cells[0].section
              return (
                <div key={s.id} className={cellResponsiveClasses(s.settings) || undefined}>
                  <SectionRenderer section={s} pageKey={coll.template_page_key as string} whatsappNumber={ctx.config?.whatsapp_number} />
                </div>
              )
            }
            return (
              <div key={`row-${row.rowId}-${ri}`} className="mx-auto px-4 py-2 grid grid-cols-1 lg:grid-cols-12 items-start" style={{ maxWidth: '80rem', gap: '1.5rem' }}>
                {row.cells.map(({ section: s, span }) => (
                  <div key={s.id} className={`${cellSpanClass(span)} ${cellResponsiveClasses(s.settings)}`.trim()}>
                    <SectionRenderer section={s} pageKey={coll.template_page_key as string} whatsappNumber={ctx.config?.whatsapp_number} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )
    }
  }

  const hero = firstByType(coll.fields, rec.data, ['image'])
  const dateField = coll.fields.find((f) => f.type === 'date' && typeof rec.data[f.key] === 'string')
  const bodyFields = coll.fields.filter((f) => f.key !== hero?.field.key && f.key !== dateField?.key)

  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {preview && <PreviewBanner />}
      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-wide text-brand-primary/50 mb-2">{coll.label}</p>
        <h1 className="font-display text-3xl text-brand-primary">{rec.title ?? item}</h1>
        {dateField && typeof rec.data[dateField.key] === 'string' && (
          <p className="text-sm text-brand-primary/50 mt-1">{formatDate(String(rec.data[dateField.key]))}</p>
        )}
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.value} alt={rec.title ?? ''} className="w-full rounded-2xl mt-6 object-cover" />
        )}
        <div className="mt-6 space-y-5">
          {bodyFields.map((f) => {
            const v = rec.data[f.key]
            if (v === undefined || v === null || v === '') return null
            if (f.type === 'boolean') {
              return <p key={f.key} className="text-sm text-brand-primary/70"><span className="font-semibold">{f.label}:</span> {v ? 'Sí' : 'No'}</p>
            }
            if (f.type === 'url' || f.type === 'relation') {
              const href = f.type === 'relation' ? `/${f.relationTo ?? ''}/${String(v)}` : String(v)
              return <p key={f.key}><a href={href} className="text-brand-primary underline">{f.label}</a></p>
            }
            if (f.type === 'image') {
              // eslint-disable-next-line @next/next/no-img-element
              return <img key={f.key} src={String(v)} alt={f.label} className="w-full rounded-xl object-cover" />
            }
            if (f.type === 'file') {
              return <p key={f.key}><a href={String(v)} className="text-brand-primary underline">{f.label}</a></p>
            }
            if (f.type === 'date') {
              return <p key={f.key} className="text-sm text-brand-primary/70"><span className="font-semibold">{f.label}:</span> {formatDate(String(v))}</p>
            }
            if (f.type === 'textarea' || f.type === 'richtext') {
              return <div key={f.key} className="prose prose-sm max-w-none text-brand-text whitespace-pre-line">{String(v)}</div>
            }
            return <p key={f.key} className="text-brand-text"><span className="font-semibold text-brand-primary/70">{f.label}:</span> {String(v)}</p>
          })}
        </div>
      </article>
    </div>
  )
}
