/**
 * /api/admin/cms/draft — HU-128 v2 (editar en caliente)
 *
 * POST { resource: 'sections'|'items', id, action: 'save'|'publish'|'discard', patch? }
 *   • save    → fusiona `patch` en el overlay `draft` (no toca lo publicado).
 *   • publish → copia el overlay a las columnas en vivo y limpia el borrador.
 *   • discard → borra el overlay (draft = null).
 *
 * El público nunca ve el borrador; solo la vista previa (is_admin) lo fusiona.
 * Acotado por rol + RLS del tenant (getAdminDb).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import {
  saveSectionDraft, publishSectionDraft, discardSectionDraft,
  saveItemDraft, publishItemDraft, discardItemDraft,
} from '@merkiai/database'
import { validateSectionPayload, validateItemByItemType } from '@/lib/section-validation'

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'contenido')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const resource = body.resource as 'sections' | 'items'
  const id = Number(body.id)
  const action = body.action as 'save' | 'publish' | 'discard'
  const patch = (body.patch ?? {}) as Record<string, unknown>

  if (resource !== 'sections' && resource !== 'items') {
    return NextResponse.json({ error: 'resource inválido' }, { status: 400 })
  }
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  if (!['save', 'publish', 'discard'].includes(action)) {
    return NextResponse.json({ error: 'action inválida' }, { status: 400 })
  }

  const db = getAdminDb(adminUser.tenantId)

  try {
    if (resource === 'sections') {
      if (action === 'save') {
        // Valida el overlay contra el contrato del bloque (resuelve el tipo por id).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const type = (await (db.from('page_sections') as any).select('section_type').eq('id', id).maybeSingle()).data?.section_type
        if (typeof type === 'string') {
          const v = validateSectionPayload(type, patch)
          if (!v.ok) return NextResponse.json({ error: 'Datos inválidos', details: v.errors }, { status: 422 })
        }
        await saveSectionDraft(id, patch, db)
      } else if (action === 'publish') await publishSectionDraft(id, db)
      else await discardSectionDraft(id, db)
    } else {
      if (action === 'save') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemType = (await (db.from('section_items') as any).select('item_type').eq('id', id).maybeSingle()).data?.item_type
        if (typeof itemType === 'string') {
          const v = validateItemByItemType(itemType, patch)
          if (!v.ok) return NextResponse.json({ error: 'Datos inválidos', details: v.errors }, { status: 422 })
        }
        await saveItemDraft(id, patch, db)
      } else if (action === 'publish') await publishItemDraft(id, db)
      else await discardItemDraft(id, db)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
