/**
 * /api/admin/cms/apply-blueprint — E3/E17 · HU-373 (parte admin)
 * POST { preset_key } → aplica **solo la estructura de sitio** (blueprint) del
 * preset elegido al tenant: crea las páginas que falten + navegación + regiones
 * (idempotente, en borrador). No re-aplica tema ni catálogo.
 *
 * Gated por el entitlement `site_blueprints` (planes superiores). El operador
 * sigue pudiendo aprovisionar estructuras desde la consola; esto habilita que el
 * comerciante de un plan alto elija/cambie su estructura.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { seedBlueprint, type SiteBlueprint } from '@merkiai/database'
import { getOnboardingOptions } from '@/lib/onboarding'
import { getTenantEntitlements, requireFeature, EntitlementError, FEATURES } from '@/lib/entitlements'

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { entitlements } = await getTenantEntitlements(adminUser.tenantId)
  if (entitlements) {
    try { requireFeature(entitlements, FEATURES.SITE_BLUEPRINTS) }
    catch (e) { if (e instanceof EntitlementError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e }
  }
  const body = await req.json().catch(() => ({}))
  const presetKey = String(body?.preset_key ?? '').trim()
  if (!presetKey) return NextResponse.json({ error: 'preset_key requerido' }, { status: 400 })

  const opts = await getOnboardingOptions(adminUser.tenantId)
  if (!opts) return NextResponse.json({ error: 'No se pudo consultar el catálogo de estructuras (control plane).' }, { status: 502 })
  if (!opts.allowBlueprint) return NextResponse.json({ error: 'Tu plan no incluye estructuras de sitio.' }, { status: 402 })
  const preset = opts.presets.find((p) => p.key === presetKey)
  if (!preset?.blueprint) return NextResponse.json({ error: 'La estructura elegida no existe o está vacía.' }, { status: 404 })

  try {
    const results = await seedBlueprint(
      getAdminDb(adminUser.tenantId),
      adminUser.tenantId,
      preset.blueprint as unknown as SiteBlueprint,
      { maxPages: opts.limits?.pages ?? undefined },
    )
    return NextResponse.json({ ok: true, results })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
