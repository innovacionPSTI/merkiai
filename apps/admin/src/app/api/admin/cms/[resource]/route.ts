/**
 * /api/admin/cms/[resource]
 *
 * Endpoint CMS unificado — modelo post-migración 19.
 *
 * Recursos disponibles:
 *   pages    → tabla pages         (pk = key)
 *   sections → tabla page_sections (pk = id, filter = page_key)
 *   items    → tabla section_items (pk = id, filter = section_id)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { validateSectionPayload } from '@/lib/section-validation'

// ── Tipo de tabla CMS reconocida ─────────────────────────────────────────────
// Note: section_settings and banners were dropped in migration 19 (unified CMS)
type CmsTable = 'pages' | 'page_sections' | 'section_items'

interface ResourceConfig {
  table: CmsTable
  /** Campo que actúa como clave primaria para PATCH y DELETE */
  pk: 'key' | 'id'
  /** Campos requeridos en POST */
  required: string[]
  /** Parámetro GET que filtra los resultados (opcional) */
  filterParam?: string
  /** Columna de la tabla que se filtra */
  filterField?: string
  /** Si true, el pk en DELETE/PATCH se convierte a número */
  pkNumeric?: boolean
}

const RESOURCES: Record<string, ResourceConfig> = {
  pages: {
    table: 'pages',
    pk: 'key',
    required: ['key', 'label', 'slug'],
  },
  sections: {
    table: 'page_sections',
    pk: 'id',
    pkNumeric: true,
    required: ['page_key', 'section_type'],
    filterParam: 'page_key',
    filterField: 'page_key',
  },
  items: {
    table: 'section_items',
    pk: 'id',
    pkNumeric: true,
    required: ['section_id'],
    filterParam: 'section_id',
    filterField: 'section_id',
  },
  // 'section-settings' removed — section_settings table dropped in migration 19
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const adminUser = await getAdminUser()
  if (!adminUser) return { adminUser: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  return { adminUser, error: null }
}

// ── Params type ───────────────────────────────────────────────────────────────

type RouteParams = { params: Promise<{ resource: string }> }

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { adminUser, error: authError } = await requireAdmin()
  if (authError) return authError

  const { resource } = await params
  const config = RESOURCES[resource]
  if (!config) {
    return NextResponse.json({ error: `Recurso desconocido: ${resource}` }, { status: 404 })
  }

  const supabase = getAdminDb(adminUser!.tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from(config.table) as any).select('*').order('order_index')

  if (config.filterParam && config.filterField) {
    const filterValue = new URL(req.url).searchParams.get(config.filterParam)
    if (filterValue) {
      const value = config.pkNumeric && config.filterParam === 'section_id'
        ? Number(filterValue)
        : filterValue
      query = query.eq(config.filterField, value)
    }
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { adminUser, error: authError } = await requireAdmin()
  if (authError) return authError

  const { resource } = await params
  const config = RESOURCES[resource]
  if (!config) {
    return NextResponse.json({ error: `Recurso desconocido: ${resource}` }, { status: 404 })
  }

  const body = await req.json()

  // Validar campos requeridos
  const missing = config.required.filter((f) => body[f] === undefined || body[f] === null || body[f] === '')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Campos requeridos: ${missing.join(', ')}` }, { status: 400 })
  }

  // HU-218.4: valida los campos de la sección contra el contrato del bloque.
  if (resource === 'sections' && typeof body.section_type === 'string') {
    const v = validateSectionPayload(body.section_type, body)
    if (!v.ok) return NextResponse.json({ error: 'Datos inválidos', details: v.errors }, { status: 422 })
  }

  const now = new Date().toISOString()
  const supabase = getAdminDb(adminUser!.tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(config.table) as any)
    .insert({ ...body, tenant_id: adminUser!.tenantId, created_at: now, updated_at: now })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { adminUser, error: authError } = await requireAdmin()
  if (authError) return authError

  const { resource } = await params
  const config = RESOURCES[resource]
  if (!config) {
    return NextResponse.json({ error: `Recurso desconocido: ${resource}` }, { status: 404 })
  }

  const body = await req.json()
  const pkValue = body[config.pk]
  if (!pkValue && pkValue !== 0) {
    return NextResponse.json({ error: `Campo "${config.pk}" requerido` }, { status: 400 })
  }

  // Separar pk del payload
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [config.pk]: _pk, ...fields } = body
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const resolvedPk = config.pkNumeric ? Number(pkValue) : pkValue
  const now = new Date().toISOString()
  const supabase = getAdminDb(adminUser!.tenantId)

  // HU-218.4: valida los campos contra el contrato del bloque. El PATCH no trae
  // section_type → se resuelve por id (acotado por RLS al tenant del admin).
  if (resource === 'sections') {
    const type = typeof fields.section_type === 'string'
      ? (fields.section_type as string)
      : (await (supabase.from('page_sections') as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .select('section_type').eq('id', resolvedPk).maybeSingle()).data?.section_type
    if (typeof type === 'string') {
      const v = validateSectionPayload(type, fields)
      if (!v.ok) return NextResponse.json({ error: 'Datos inválidos', details: v.errors }, { status: 422 })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(config.table) as any)
    .update({ ...fields, updated_at: now })
    .eq(config.pk, resolvedPk)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { adminUser, error: authError } = await requireAdmin()
  if (authError) return authError

  const { resource } = await params
  const config = RESOURCES[resource]
  if (!config) {
    return NextResponse.json({ error: `Recurso desconocido: ${resource}` }, { status: 404 })
  }

  const pkValue = new URL(req.url).searchParams.get(config.pk)
  if (!pkValue) {
    return NextResponse.json({ error: `Parámetro "${config.pk}" requerido` }, { status: 400 })
  }

  const resolvedPk = config.pkNumeric ? Number(pkValue) : pkValue
  const supabase = getAdminDb(adminUser!.tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(config.table) as any)
    .delete()
    .eq(config.pk, resolvedPk)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
