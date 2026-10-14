import { NextRequest, NextResponse } from 'next/server'
import { getVariantsForCart } from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/catalog/variants?ids=1,2,3 → datos actuales de variantes para
 * re-agregar al carrito (HU-112 reorder). Público (anon RLS por tenant); solo
 * variantes activas de productos activos.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') ?? ''
  const ids = raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n))
  if (ids.length === 0) return NextResponse.json({ variants: [] })
  try {
    const db = await getRequestCatalogDb()
    const variants = await getVariantsForCart(db, ids.slice(0, 100))
    return NextResponse.json({ variants })
  } catch {
    return NextResponse.json({ variants: [] })
  }
}
