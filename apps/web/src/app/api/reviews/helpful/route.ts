import { incrementReviewHelpful } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestCatalogDb } from '@/lib/tenant-db'

export const dynamic = 'force-dynamic'

/**
 * POST → suma 1 al voto "útil" de una reseña (HU-101 v2). Acotado por tenant +
 * reseña aprobada en el RPC (SECURITY DEFINER). El doble-voto se evita en el
 * cliente (localStorage); el servidor solo incrementa.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = Number(body?.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Reseña inválida' }, { status: 400 })
  try {
    const db = await getRequestCatalogDb()
    const count = await incrementReviewHelpful(db, id)
    if (count === null) return NextResponse.json({ error: 'No se pudo registrar' }, { status: 404 })
    return NextResponse.json({ ok: true, helpful_count: count })
  } catch {
    return NextResponse.json({ error: 'No se pudo registrar' }, { status: 500 })
  }
}
