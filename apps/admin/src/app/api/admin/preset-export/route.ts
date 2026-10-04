/**
 * GET /api/admin/preset-export — HU-256
 * Empaqueta el estado actual de la tienda (Tema activo + secciones del home +
 * modelo de inventario) como un PresetPayload re-aplicable, descargable en JSON.
 * El operador lo importa luego como preset en la consola (HU-233).
 */
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import { getActiveTheme, getPageSections, getSectionItems, getStoreConfig, buildStorePresetPayload } from '@merkiai/database'

export async function GET() {
  const user = await getAdminUser()
  if (!user || !canAccess(user.role, 'configuracion')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const db = getAdminDb(user.tenantId)

  try {
    const [theme, config, sections] = await Promise.all([
      getActiveTheme(db).catch(() => null),
      getStoreConfig(db, user.tenantId).catch(() => null),
      getPageSections('home', false, db).catch(() => []),
    ])
    const homeSections = await Promise.all(
      sections.map(async (s) => ({ ...s, items: await getSectionItems(s.id, false, db).catch(() => []) })),
    )

    const payload = buildStorePresetPayload({
      theme: theme as unknown as Record<string, unknown> | null,
      homeSections,
      inventoryModel: config?.inventory_model ?? 'single',
    })

    // Envoltorio informativo para el operador (lo importa en la consola).
    const out = { kind: 'merkiai.preset-payload', schema_version: 1, exported_at: new Date().toISOString(), payload }
    return new NextResponse(JSON.stringify(out, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="preset-desde-tienda.json"',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
