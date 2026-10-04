/**
 * POST /api/admin/cms/duplicate — HU-251
 * Duplica una sección (con sus ítems) o un ítem. La copia se añade al final
 * (mayor order_index + 1); `section_key`/ids se regeneran (default de BD).
 * Body: { resource: 'sections'|'items', id }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'

// Columnas que se copian (sin id/section_key/tenant_id/draft/timestamps).
const SECTION_COLS = ['page_key', 'section_type', 'title', 'subtitle', 'body', 'image_url', 'cta_label', 'cta_url', 'enabled', 'settings']
const ITEM_COLS = ['section_id', 'item_type', 'icon', 'title', 'description', 'question', 'answer', 'image_url', 'image_url_mobile', 'link_url', 'cta_text', 'metadata', 'enabled']

function copy(row: Record<string, unknown>, cols: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of cols) if (c in row) out[c] = row[c]
  return out
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'contenido')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const resource = body.resource as 'sections' | 'items'
  const id = Number(body.id)
  if ((resource !== 'sections' && resource !== 'items') || !Number.isFinite(id)) {
    return NextResponse.json({ error: 'parámetros inválidos' }, { status: 400 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getAdminDb(user.tenantId) as any
  const now = new Date().toISOString()

  try {
    if (resource === 'sections') {
      const { data: row } = await db.from('page_sections').select('*').eq('id', id).maybeSingle()
      if (!row) return NextResponse.json({ error: 'Sección no encontrada' }, { status: 404 })
      const { data: maxRow } = await db.from('page_sections').select('order_index').eq('page_key', row.page_key).order('order_index', { ascending: false }).limit(1).maybeSingle()
      const order_index = (maxRow?.order_index ?? row.order_index ?? 0) + 1
      const { data: created, error } = await db.from('page_sections')
        .insert({ ...copy(row, SECTION_COLS), tenant_id: user.tenantId, order_index, created_at: now, updated_at: now })
        .select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      // Copiar ítems de la sección original.
      const { data: items } = await db.from('section_items').select('*').eq('section_id', id).order('order_index')
      for (const it of items ?? []) {
        await db.from('section_items').insert({ ...copy(it, ITEM_COLS), section_id: created.id, tenant_id: user.tenantId, created_at: now, updated_at: now })
      }
      return NextResponse.json({ id: created.id }, { status: 201 })
    }

    // items
    const { data: row } = await db.from('section_items').select('*').eq('id', id).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })
    const { data: maxRow } = await db.from('section_items').select('order_index').eq('section_id', row.section_id).order('order_index', { ascending: false }).limit(1).maybeSingle()
    const order_index = (maxRow?.order_index ?? row.order_index ?? 0) + 1
    const { data: created, error } = await db.from('section_items')
      .insert({ ...copy(row, ITEM_COLS), tenant_id: user.tenantId, order_index, created_at: now, updated_at: now })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
