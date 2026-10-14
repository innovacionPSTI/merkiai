import type { Db } from '../client'
import { getBestSellingProducts } from './products'

/**
 * HU-286 v2 · Carrusel de productos (bloque CMS reutilizable). Resuelve la
 * fuente elegida por el comerciante y devuelve tarjetas ligeras (sin variantes).
 * `db` se pasa por parámetro (RLS por tenant). Agnóstico de nicho.
 */

export type CarouselSource = 'featured' | 'best_selling' | 'newest' | 'category' | 'manual'

export interface CarouselProduct {
  id: number
  slug: string
  name: string
  imageUrl: string | null
  price: number | null
}

export interface CarouselOptions {
  source: CarouselSource
  categorySlug?: string | null
  slugs?: string[]
  limit?: number
}

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 24

/** Normaliza el límite a un entero dentro de rango. */
export function clampCarouselLimit(n: unknown): number {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v) || v <= 0) return DEFAULT_LIMIT
  return Math.min(v, MAX_LIMIT)
}

/** Parte una lista de slugs separada por coma (o salto de línea), sin vacíos. */
export function parseSlugList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean)
  if (typeof raw !== 'string') return []
  return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
}

/** Normaliza la fuente a un valor válido (fallback 'featured'). */
export function normalizeCarouselSource(raw: unknown): CarouselSource {
  const valid: CarouselSource[] = ['featured', 'best_selling', 'newest', 'category', 'manual']
  return valid.includes(raw as CarouselSource) ? (raw as CarouselSource) : 'featured'
}

interface ProductRow {
  id: number
  slug: string
  name: string
  images: unknown
  min_price: number | null
}

function toCard(p: ProductRow): CarouselProduct {
  const imgs = Array.isArray(p.images) ? (p.images as Array<{ url?: string }>) : []
  return { id: p.id, slug: p.slug, name: p.name, imageUrl: imgs[0]?.url ?? null, price: p.min_price ?? null }
}

const CARD_COLS = 'id, slug, name, images, min_price'

export async function getCarouselProducts(db: Db, opts: CarouselOptions): Promise<CarouselProduct[]> {
  const limit = clampCarouselLimit(opts.limit)
  const source = normalizeCarouselSource(opts.source)

  try {
    if (source === 'manual') {
      const slugs = (opts.slugs ?? []).slice(0, MAX_LIMIT)
      if (slugs.length === 0) return []
      const { data } = await db.from('products').select(CARD_COLS).eq('active', true).in('slug', slugs)
      const rows = (data ?? []) as ProductRow[]
      // Preserva el orden declarado por el comerciante.
      const bySlug = new Map(rows.map((r) => [r.slug, r]))
      return slugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, limit).map((r) => toCard(r as ProductRow))
    }

    if (source === 'best_selling') {
      const best = await getBestSellingProducts(limit, db)
      return best.map((b) => ({ id: b.product_id, slug: b.slug ?? '', name: b.product_name, imageUrl: b.image_url ?? null, price: null }))
    }

    if (source === 'category') {
      const slug = (opts.categorySlug ?? '').trim()
      if (!slug) return []
      const { data: cat } = await db.from('categories').select('id').eq('slug', slug).maybeSingle()
      if (!cat) return []
      const { data } = await db
        .from('products').select(CARD_COLS)
        .eq('active', true).eq('category_id', (cat as { id: number }).id)
        .order('featured', { ascending: false }).order('created_at', { ascending: false })
        .limit(limit)
      return ((data ?? []) as ProductRow[]).map(toCard)
    }

    // featured | newest
    let q = db.from('products').select(CARD_COLS).eq('active', true)
    if (source === 'featured') q = q.eq('featured', true)
    q = q.order('created_at', { ascending: false }).limit(limit)
    const { data } = await q
    return ((data ?? []) as ProductRow[]).map(toCard)
  } catch (e) {
    console.error('[carousel] getCarouselProducts error:', e instanceof Error ? e.message : e)
    return []
  }
}
