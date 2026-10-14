import { NextRequest, NextResponse } from 'next/server'
import { getProductsStockMap } from '@merkiai/database'
import { getRequestCatalogDb } from '@/lib/tenant-db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/catalog/stock?ids=1,2,3 → mapa product_id → disponibilidad (HU-103 v2).
 * Público (anon RLS por tenant). Usado por la wishlist para marcar "agotado".
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') ?? ''
  const ids = raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n))
  if (ids.length === 0) return NextResponse.json({ stock: {} })
  try {
    const db = await getRequestCatalogDb()
    const stock = await getProductsStockMap(db, ids.slice(0, 100))
    return NextResponse.json({ stock })
  } catch {
    return NextResponse.json({ stock: {} })
  }
}
