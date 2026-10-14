import type { Db } from '../client'
import type { ProductReview } from '../types'

/**
 * Reseñas de producto (HU-101). El storefront lee solo las aprobadas (RLS);
 * el admin modera con su cliente is_admin. `db` se pasa por parámetro (RLS por
 * tenant); nunca service-role en el plano de tienda.
 */

export interface ReviewStats {
  count: number
  average: number // 0 si no hay reseñas; redondeado a 1 decimal
}

/** Reseñas APROBADAS de un producto, más recientes primero. */
export async function getApprovedReviews(db: Db, productId: number): Promise<ProductReview[]> {
  const { data } = await db
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  return (data ?? []) as ProductReview[]
}

/** Promedio + conteo de reseñas aprobadas (para estrellas y JSON-LD). */
export function reviewStats(reviews: Pick<ProductReview, 'rating'>[]): ReviewStats {
  if (reviews.length === 0) return { count: 0, average: 0 }
  const sum = reviews.reduce((a, r) => a + r.rating, 0)
  return { count: reviews.length, average: Math.round((sum / reviews.length) * 10) / 10 }
}

/** HU-101 v2 · Solo las calificaciones aprobadas (ligero, para promedio/estrellas). */
export async function getApprovedRatings(db: Db, productId: number): Promise<number[]> {
  const { data } = await db
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')
  return (data ?? []).map((r: { rating: number }) => r.rating)
}

export const REVIEWS_PAGE_SIZE = 5

/**
 * HU-101 v2 · Página de reseñas aprobadas (más recientes primero) + total.
 * Orden estable para paginar; `total` permite el botón "Cargar más".
 */
export async function getApprovedReviewsPage(
  db: Db,
  productId: number,
  limit = REVIEWS_PAGE_SIZE,
  offset = 0,
): Promise<{ reviews: ProductReview[]; total: number }> {
  const { data, count } = await db
    .from('product_reviews')
    .select('*', { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return { reviews: (data ?? []) as ProductReview[], total: count ?? 0 }
}

/**
 * HU-101 v2 · Suma 1 al contador "útil" de una reseña vía RPC (acotado por
 * tenant + aprobada en la función SECURITY DEFINER). Devuelve el nuevo total o
 * null si la reseña no existe/visible.
 */
export async function incrementReviewHelpful(db: Db, reviewId: number): Promise<number | null> {
  if (!Number.isInteger(reviewId)) return null
  const { data, error } = await db.rpc('increment_review_helpful', { p_id: reviewId })
  if (error) return null
  return typeof data === 'number' ? data : null
}

export interface CreateReviewInput {
  product_id: number
  author_name: string
  rating: number
  title?: string | null
  body?: string | null
  customer_id?: string | null
}

/** Valida el payload de una reseña nueva (puro). */
export function validateReview(input: Partial<CreateReviewInput>): string | null {
  if (!input.product_id || !Number.isInteger(input.product_id)) return 'Producto inválido.'
  if (!input.author_name || !input.author_name.trim()) return 'El nombre es obligatorio.'
  if (!Number.isInteger(input.rating) || (input.rating as number) < 1 || (input.rating as number) > 5) return 'La calificación debe ser de 1 a 5.'
  if (input.body && input.body.length > 2000) return 'El comentario es demasiado largo.'
  return null
}

/** Crea una reseña en estado `pending` (moderación). RLS exige tenant + pending. */
export async function createReview(db: Db, input: CreateReviewInput, tenantId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from('product_reviews').insert({
    tenant_id: tenantId,
    product_id: input.product_id,
    customer_id: input.customer_id ?? null,
    author_name: input.author_name.trim(),
    rating: input.rating,
    title: input.title?.trim() || null,
    body: input.body?.trim() || null,
    status: 'pending',
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ── Admin (moderación) ────────────────────────────────────────────────────────

/** Lista reseñas (opcionalmente por estado) para moderación. Admin (is_admin). */
export async function listReviews(db: Db, status?: 'pending' | 'approved' | 'rejected'): Promise<ProductReview[]> {
  let q = db.from('product_reviews').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data } = await q
  return (data ?? []) as ProductReview[]
}

export async function setReviewStatus(db: Db, id: number, status: 'approved' | 'rejected' | 'pending'): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from('product_reviews').update({ status }).eq('id', id)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function deleteReview(db: Db, id: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from('product_reviews').delete().eq('id', id)
  return error ? { ok: false, error: error.message } : { ok: true }
}
