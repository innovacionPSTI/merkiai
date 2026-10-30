/**
 * PartialRef (HU-356) — inyecta un "partial" (página reutilizable) por referencia.
 *
 * Server component async: lee `partial_key` de los settings y renderiza las
 * secciones de esa página con el mismo `SectionRenderer`. El partial se edita en
 * un solo lugar (su página) y el cambio se refleja en todas las que lo referencian.
 * Guarda anti-recursión: NO renderiza `partial_ref` anidados (evita bucles).
 */
import { resolveBlockFields, getSectionsWithItems, type SectionLike } from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import SectionRenderer from './SectionRenderer'

export default async function PartialRef({ section }: { section?: SectionLike | null }) {
  const f = resolveBlockFields('partial_ref', section, undefined)
  const key = (f.partial_key as string)?.trim()
  if (!key) return null

  const db = await getRequestCatalogDb().catch(() => null)
  if (!db) return null
  const sections = await getSectionsWithItems(key, true, db).catch(() => [])
  // Anti-recursión: ignora partials dentro del partial (evita bucles).
  const safe = sections.filter((s) => s.section_type !== 'partial_ref')
  if (safe.length === 0) return null

  return (
    <>
      {safe.map((s) => <SectionRenderer key={s.id} section={s} pageKey={key} />)}
    </>
  )
}
