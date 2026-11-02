/**
 * /api/admin/quotes/[id] — E24 · HU-408
 * GET   → cotización con sus líneas.
 * PATCH → cambia el estado (sent/accepted/cancelled/expired). La conversión a
 *         orden y el apartado son Fase 2 (tocan orden/pagos/ledger).
 * Tenant-scoped + gated por `quotes`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { getQuote, updateQuoteStatus, isQuoteStatus, type QuoteStatus } from '@merkiai/database'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

async function gate(tenantId: string) {
  const { entitlements } = await getTenantEntitlements(tenantId)
  if (entitlements) requireFeature(entitlements, FEATURES.QUOTES)
}

// Transiciones permitidas por la UI en esta fase (sin 'converted').
const ALLOWED: QuoteStatus[] = ['draft', 'sent', 'accepted', 'cancelled', 'expired']

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const found = await getQuote(getAdminDb(adminUser.tenantId), id)
  if (!found) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(found)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { await gate(adminUser.tenantId) }
  catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  const id = Number((await params).id)
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  if (!isQuoteStatus(body?.status) || !ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }
  try {
    const quote = await updateQuoteStatus(getAdminDb(adminUser.tenantId), id, body.status)
    return NextResponse.json(quote)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
