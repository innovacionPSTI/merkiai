import { suggestProducts } from '@merkiai/database'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestCatalogDb } from '@/lib/tenant-db'

export const dynamic = 'force-dynamic'

/**
 * GET → sugerencias de autocompletado de productos (HU-102). Acotado por tenant
 * vía RLS (getRequestCatalogDb, Host→tenant). Consulta ligera (sin variantes).
 *   ?q=<texto>&limit=<n>
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  const limit = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 6))
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const db = await getRequestCatalogDb()
    const suggestions = await suggestProducts(db, q, limit)
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
