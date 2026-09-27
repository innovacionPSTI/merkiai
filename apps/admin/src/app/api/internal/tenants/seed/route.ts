/**
 * POST /api/internal/tenants/seed — Semilla de config por tenant (HU-207).
 *
 * Lo invoca la **consola (control plane)** al aprovisionar un tenant: como la
 * config vive en el plano de tienda (store/payment/shipping/admin_config + página
 * home) y aún no hay sesión del dueño, el control plane delega en el admin la
 * creación idempotente de esas filas.
 *
 * Auth: `withInternalAuth` (x-internal-secret, timing-safe, rate-limit,
 * fail-closed). service-role legítimo aquí (autorizado por el control plane;
 * toca varias tablas antes de que exista el dueño).
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  createServerClient,
  seedTenantConfig,
  applyPresetToStore,
  type PresetPayload,
  type ApplyPresetLimits,
} from '@merkiai/database'
import { withInternalAuth } from '@/lib/internal-route'

/**
 * Cuerpo aceptado:
 *  - tenantId (req), storeName (opt).
 *  - preset (opt, HU-235): payload del preset a aplicar (Tema/Template/home/
 *    categorías/productos). Si viene, se siembra la config con las secciones del
 *    preset y luego se copia el resto al plano de tienda.
 *  - limits (opt): topes del plan (HU-239) que la consola ya resolvió.
 */
export const POST = withInternalAuth(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    tenantId?: string
    storeName?: string
    preset?: PresetPayload
    limits?: ApplyPresetLimits
  }
  const tenantId = String(body.tenantId ?? '').trim()
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 })
  }

  try {
    const db = createServerClient()
    const preset = body.preset
    // La config nace con las secciones del preset (si hay) o el default genérico.
    const seed = await seedTenantConfig(
      tenantId,
      { storeName: body.storeName, homeSections: preset?.home_sections },
      db,
    )
    const results: Record<string, unknown> = { ...seed.results }

    // HU-235: copiar el resto del preset (Tema/Template/categorías/productos).
    if (preset) {
      const applied = await applyPresetToStore(tenantId, preset, { limits: body.limits }, db)
      results.preset = applied.results
    }

    const flat = Object.values(results).flatMap((v) =>
      typeof v === 'string' ? [v] : Object.values(v as Record<string, string>),
    )
    const hasErr = flat.some((v) => typeof v === 'string' && v.startsWith('error'))
    return NextResponse.json({ tenantId, results }, { status: hasErr ? 207 : 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al sembrar config' }, { status: 500 })
  }
})
