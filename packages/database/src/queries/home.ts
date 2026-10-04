/**
 * queries/home.ts
 *
 * Datos de la página Home consolidados en una sola función.
 * Tras la migración 19 (CMS unificado), el home se gestiona
 * íntegramente desde page_sections + section_items, igual que
 * el resto de páginas del sitio.
 *
 * Los datos "dinámicos" (productos, blog, categorías) se siguen
 * cargando en paralelo desde sus propios módulos.
 */

import type { Db } from '../client'
import { getFeaturedProducts, getBestSellingProducts, getCategories } from './products'
import { getBlogPosts } from './blog'
import { applySectionDraft, applyItemDraft } from './content-draft'
import type { PageSection, SectionItem } from '../types'
import type { BestSellingProduct } from './products'

export type HomeSection = PageSection & { items: SectionItem[] }

export interface WebHomeData {
  homeSections: HomeSection[]
  featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>>
  blogPosts:        Awaited<ReturnType<typeof getBlogPosts>>
  bestSellers:      BestSellingProduct[]
  categories:       Awaited<ReturnType<typeof getCategories>>
}

/**
 * Obtiene todos los datos necesarios para renderizar la página Home pública.
 * Las secciones del home (hero, services, historia, etc.) vienen de
 * page_sections + section_items con page_key = 'home'.
 * El resto de queries corre en paralelo — fallo individual no rompe el render.
 */
export async function getWebHomeData(db: Db, opts: { preview?: boolean } = {}): Promise<WebHomeData> {
  const supabase = db

  async function fetchHomeSections(): Promise<HomeSection[]> {
    const { data: sections, error: sErr } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_key', 'home')
      .order('order_index')
    if (sErr || !sections?.length) return []

    const sectionIds = sections.map((s) => s.id)
    // En vista previa (HU-128) se incluyen los ítems deshabilitados para que el
    // comerciante vea el contenido en borrador antes de publicarlo.
    let itemsQuery = supabase
      .from('section_items')
      .select('*')
      .in('section_id', sectionIds)
    if (!opts.preview) itemsQuery = itemsQuery.eq('enabled', true)
    const { data: items } = await itemsQuery.order('order_index')

    // HU-128 v2: en preview fusiona el overlay `draft` (editar en caliente).
    const bySection = (items ?? []).reduce<Record<number, SectionItem[]>>((acc, item) => {
      const it = opts.preview ? applyItemDraft(item as SectionItem) : (item as SectionItem)
      if (!acc[it.section_id]) acc[it.section_id] = []
      acc[it.section_id].push(it)
      return acc
    }, {})

    return sections.map((s) => {
      const section = opts.preview ? applySectionDraft(s as PageSection) : (s as PageSection)
      return { ...section, items: bySection[s.id] ?? [] } as HomeSection
    })
  }

  // HU-207: propagar el cliente tenant-scoped a TODAS las sub-queries (antes
  // usaban service-role → tenant por defecto, filtrando contenido del default
  // en la home de cualquier tenant).
  const [homeSections, featuredProducts, blogPosts, bestSellers, categories] = await Promise.all([
    fetchHomeSections().catch(() => [] as HomeSection[]),
    getFeaturedProducts(3, db).catch(() => []),
    getBlogPosts({ limit: 2 }, db).catch(() => []),
    getBestSellingProducts(4, db).catch(() => [] as BestSellingProduct[]),
    getCategories(db).catch(() => []),
  ])

  return { homeSections, featuredProducts, blogPosts, bestSellers, categories }
}
