/**
 * CollectionList (HU-355) — bloque CMS de listado dinámico de una colección.
 *
 * Server component async: lee su configuración (colección, orden, filtro, límite,
 * presentación) de los settings del bloque y fetchea por RLS de tenant los
 * registros PUBLICADOS. Enlaza a cada registro en `/[colección]/[slug]` (HU-354).
 * Estilos solo con tokens de tema. Genérico: noticias, eventos, cursos, personas…
 */
import Link from 'next/link'
import {
  resolveBlockFields, resolveCollectionList,
  type SectionLike, type Collection, type CollectionItem,
} from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'

function pickImage(collection: Collection, it: CollectionItem): string | null {
  const f = collection.fields.find((x) => x.type === 'image' && typeof it.data?.[x.key] === 'string' && it.data[x.key])
  return f ? String(it.data[f.key]) : null
}
function pickExcerpt(collection: Collection, it: CollectionItem): string | null {
  const f = collection.fields.find((x) => ['textarea', 'richtext', 'text'].includes(x.type) && typeof it.data?.[x.key] === 'string' && (it.data[x.key] as string).trim())
  return f ? String(it.data[f.key]).slice(0, 140) : null
}

export default async function CollectionList({
  section, template,
}: {
  section?: SectionLike | null
  template?: string
}) {
  const f = resolveBlockFields('collection_list', section, template)
  const collectionKey = (f.collection_key as string)?.trim()
  if (!collectionKey) return null

  const db = await getRequestCatalogDb().catch(() => null)
  if (!db) return null

  const { collection, items } = await resolveCollectionList(db, {
    collectionKey,
    limit: Number(f.limit) || 6,
    orderBy: (f.order_by as 'recent' | 'oldest' | 'title' | 'manual') ?? 'recent',
    filterField: (f.filter_field as string) ?? null,
    filterValue: (f.filter_value as string) ?? null,
  }).catch(() => ({ collection: null, items: [] }))

  if (!collection || items.length === 0) return null
  const title = (f.title as string) || collection.label
  const isList = f.layout === 'list'

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="font-display text-brand-primary text-section mb-6">{title}</h2>
      <div className={isList ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
        {items.map((it) => {
          const img = pickImage(collection, it)
          const excerpt = pickExcerpt(collection, it)
          return (
            <Link
              key={it.id}
              href={`/${collectionKey}/${it.slug}`}
              className={`group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow ${isList ? 'flex gap-4 items-center' : ''}`}
            >
              {img && (
                <div className={isList ? 'w-32 h-24 shrink-0 bg-brand-cream overflow-hidden' : 'h-44 bg-brand-cream overflow-hidden'}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={it.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-4">
                <p className="font-display text-brand-primary text-lg leading-tight">{it.title ?? it.slug}</p>
                {excerpt && <p className="font-brand text-sm text-brand-text/70 mt-1 line-clamp-2">{excerpt}</p>}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
