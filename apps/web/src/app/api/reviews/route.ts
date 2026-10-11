import { createReview, validateReview } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestCatalogDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

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
