/**
 * POST /api/admin/import
 *
 * Restaura un snapshot JSON exportado por /api/admin/export.
 * Idempotente: usa upsert con las claves estables **por tenant** de cada tabla.
 *
 * Aislamiento (HU-158 · cierre): la restauración corre con el cliente RLS del
 * tenant del admin (`getAdminDb`), NO con service-role. Además se **fuerza**
 * `tenant_id = adminUser.tenantId` en cada fila, sobrescribiendo cualquier
 * `tenant_id` que traiga el snapshot → un import solo puede escribir en el
 * tenant de quien lo ejecuta (las políticas `*_admin_all` con WITH CHECK
 * bloquean cualquier fila de otro tenant: fail-closed).
 *
 * Claves estables (onConflict) tras e17/03+04 (UNIQUE/PK por tenant):
 *   - store_config   → tenant_id (una fila por tenant)
 *   - admin_config   → tenant_id (una fila por tenant)
 *   - themes         → id (surrogate; RLS acota al tenant)
 *   - nav_items      → tenant_id,nav_key
 *   - pages          → tenant_id,key   (PK compuesta)
 *   - page_sections  → tenant_id,section_key
 *   - section_items  → id (surrogate; RLS acota al tenant)
 *
 * Versiones soportadas:
 *   v1 — section_settings y banners (tablas eliminadas en migración 19; ignoradas silenciosamente)
 *   v2 — CMS unificado
 *   v3 — agrega admin_config y themes
 *
 * Solo accesible por super_admin y admin.
 * Body: JSON del snapshot (Content-Type: application/json)
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- upsert de snapshot heterogéneo: las filas se validan por RLS/constraints, no por tipos estáticos. */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  let snapshot: Record<string, unknown>
  try {
    snapshot = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (typeof snapshot !== 'object' || snapshot === null) {
    return NextResponse.json({ error: 'Formato de snapshot inválido' }, { status: 400 })
  }

  const tenantId = user.tenantId
  const db = getAdminDb(tenantId)
  const results: Record<string, string> = {}

  // Fuerza el tenant del admin en cada fila (ignora el que traiga el snapshot).
  const withTenant = (row: any): any => ({ ...row, tenant_id: tenantId })
  const asRows = (rows: unknown[]) => rows as any[]

  try {
    // ── 1. store_config (una fila por tenant) ────────────────────────────────
    if (snapshot.store_config && typeof snapshot.store_config === 'object') {
      const { error: e } = await db
        .from('store_config')
        .upsert(withTenant(snapshot.store_config as Record<string, unknown>), { onConflict: 'tenant_id' })
      results.store_config = e ? `error: ${e.message}` : 'ok'
    }

    // ── 2. admin_config (una fila por tenant) ────────────────────────────────
    if (snapshot.admin_config && typeof snapshot.admin_config === 'object') {
      const { error: e } = await db
        .from('admin_config')
        .upsert(withTenant(snapshot.admin_config as Record<string, unknown>), { onConflict: 'tenant_id' })
      results.admin_config = e ? `error: ${e.message}` : 'ok'
    }

    // ── 3. themes (surrogate id; RLS acota al tenant) ────────────────────────
    if (Array.isArray(snapshot.themes) && snapshot.themes.length > 0) {
      const rows = asRows(snapshot.themes).map(withTenant)
      const { error: e } = await db.from('themes').upsert(rows, { onConflict: 'id' })
      results.themes = e ? `error: ${e.message}` : `ok (${rows.length})`
    }

    // ── 4. nav_items (upsert por tenant_id,nav_key) ──────────────────────────
    if (Array.isArray(snapshot.nav_items) && snapshot.nav_items.length > 0) {
      const rows = asRows(snapshot.nav_items).filter((n) => n.nav_key).map(withTenant)
      if (rows.length > 0) {
        const { error: e } = await db
          .from('nav_items')
          .upsert(rows, { onConflict: 'tenant_id,nav_key', ignoreDuplicates: false })
        results.nav_items = e ? `error: ${e.message}` : `ok (${rows.length})`
      }
    }

    // ── 5. pages (upsert por PK compuesta tenant_id,key) ─────────────────────
    if (Array.isArray(snapshot.pages) && snapshot.pages.length > 0) {
      const rows = asRows(snapshot.pages).map(withTenant)
      const { error: e } = await db.from('pages').upsert(rows, { onConflict: 'tenant_id,key' })
      results.pages = e ? `error: ${e.message}` : `ok (${rows.length})`
    }

    // ── 6. page_sections (upsert por tenant_id,section_key) ──────────────────
    if (Array.isArray(snapshot.page_sections) && snapshot.page_sections.length > 0) {
      const rows = asRows(snapshot.page_sections).filter((s) => s.section_key).map(withTenant)
      if (rows.length > 0) {
        const { error: e } = await db
          .from('page_sections')
          .upsert(rows, { onConflict: 'tenant_id,section_key' })
        results.page_sections = e ? `error: ${e.message}` : `ok (${rows.length})`
      }
    }

    // ── 7. section_items (surrogate id; FK compuesta al page_section) ────────
    if (Array.isArray(snapshot.section_items) && snapshot.section_items.length > 0) {
      const rows = asRows(snapshot.section_items).map(withTenant)
      const { error: e } = await db.from('section_items').upsert(rows, { onConflict: 'id' })
      results.section_items = e ? `error: ${e.message}` : `ok (${rows.length})`
    }

    // Claves de snapshots legacy (v1) — ignoradas silenciosamente
    // section_settings, banners: eliminadas en migración 19 (CMS unificado)

    const hasErrors = Object.values(results).some((v) => v.startsWith('error'))
    return NextResponse.json(
      { success: !hasErrors, version: snapshot.version ?? 'unknown', results },
      { status: hasErrors ? 207 : 200 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    )
  }
}
