/**
 * /api/admin/quotes — E24 · HU-408
 * GET  → cotizaciones del tenant.
 * POST → crea una cotización (cabecera + líneas); genera el número.
 * Tenant-scoped + gated por `quotes`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { listQuotes, createQuote, isQuoteStatus } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate(tenantId: string) {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) requireFeature(entitlements, FEATURES.QUOTES)
}

function genQuoteNumber(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `COT-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const statusParam = req.nextUrl.searchParams.get('status')
  const status = statusParam && isQuoteStatus(statusParam) ? statusParam : undefined
  const quotes = await listQuotes(getAdminDb(adminUser.tenantId), { status, limit: 200 })
  return NextResponse.json({ quotes })
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const body = await req.json().catch(() => ({}))
  const items = Array.isArray(body?.items) ? body.items : []
  const lines = items
    .map((it: { product_id?: number; variant_id?: number; name?: string; qty?: number; unit_price?: number }) => ({
      product_id: it.product_id ? Number(it.product_id) : null,
      variant_id: it.variant_id ? Number(it.variant_id) : null,
      name: String(it.name ?? '').trim(),
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
    }))
    .filter((l: { name: string; qty: number; unit_price: number }) => l.name && l.qty > 0 && l.unit_price >= 0)
  if (!lines.length) return NextResponse.json({ error: 'Agrega al menos una línea válida' }, { status: 400 })

  try {
    const quote = await createQuote(getAdminDb(adminUser.tenantId), {
      tenant_id: adminUser.tenantId,
      quote_number: genQuoteNumber(),
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      valid_until: body.valid_until || null,
      notes: body.notes,
      discount: body.discount != null ? Number(body.discount) : 0,
      items: lines,
    })
    return NextResponse.json(quote, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
