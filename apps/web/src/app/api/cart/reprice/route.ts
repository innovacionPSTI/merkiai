import { NextRequest, NextResponse } from 'next/server'
import { priceIn, amountIn } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'
import { getApiPricing } from '@/lib/request-pricing'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cart/reprice — E28 · HU-467. Precios de las líneas del carrito en la
 * moneda del mercado de la visita (al cambiar de mercado o al cargar un carrito
 * guardado). Cuerpo: `{ locale?, variantIds: number[], bundleIds?: number[] }`.
 * Respuesta: `{ currency, prices: { [variantId]: number|null }, bundles: { [id]: number|null } }`;
 * `null` = sin precio en esa moneda. Solo lectura; el checkout recalcula igual.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { locale?: string; variantIds?: unknown[]; bundleIds?: unknown[] }
  const variantIds = (body.variantIds ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 200)
  const bundleIds = (body.bundleIds ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50)
  try {
    const { tenantId } = await resolveTenant()
    const ctx = await getApiPricing(tenantId, body.locale ?? null)
    const db = getMachineDb(tenantId)
    const prices: Record<string, number | null> = {}
    const bundles: Record<string, number | null> = {}
    if (variantIds.length) {
      const { data } = await db.from('product_variants').select('id, price, product_id').in('id', variantIds)
      for (const r of (data ?? []) as Array<{ id: number; price: number; product_id: number }>) {
        prices[String(r.id)] = priceIn(ctx, { basePrice: Number(r.price), variantId: r.id, productId: r.product_id })
      }
    }
    if (bundleIds.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any).from('bundles').select('id, price').in('id', bundleIds)
      for (const r of (data ?? []) as Array<{ id: number; price: number }>) bundles[String(r.id)] = amountIn(ctx, Number(r.price))
    }
    return NextResponse.json({ currency: ctx.currency, prices, bundles })
  } catch {
    return NextResponse.json({ error: 'No se pudieron actualizar los precios.' }, { status: 500 })
  }
}
