import { createReview, validateReview, getApprovedReviewsPage, REVIEWS_PAGE_SIZE } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

/**
 * GET → página de reseñas aprobadas de un producto (HU-101 v2, paginación).
 * `?product_id=&offset=&limit=`. Acotado por tenant vía RLS.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const productId = Number(sp.get('product_id'))
  if (!Number.isInteger(productId)) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
  const offset = Math.max(0, Number(sp.get('offset')) || 0)
  const limit = Math.min(20, Math.max(1, Number(sp.get('limit')) || REVIEWS_PAGE_SIZE))
  try {
    const db = await getRequestCatalogDb()
    const { reviews, total } = await getApprovedReviewsPage(db, productId, limit, offset)
    return NextResponse.json({ reviews, total })
  } catch {
    return NextResponse.json({ error: 'No se pudieron cargar las reseñas' }, { status: 500 })
  }
}

/**
 * POST → crea una reseña de producto en estado `pending` (HU-101). Acotado por
 * tenant vía RLS (JWT anon con tenant_id). El `tenant_id` sale del Host resuelto.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const input = {
    product_id: Number(body?.product_id),
    author_name: String(body?.author_name ?? ''),
    rating: Number(body?.rating),
    body: body?.body != null ? String(body.body) : null,
  }
  const invalid = validateReview(input)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  try {
    const { tenantId } = await resolveTenant()
    const db = await getRequestCatalogDb()
    const res = await createReview(db, input, tenantId)
    if (!res.ok) return NextResponse.json({ error: res.error ?? 'No se pudo enviar' }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'No se pudo enviar la reseña' }, { status: 500 })
  }
}
