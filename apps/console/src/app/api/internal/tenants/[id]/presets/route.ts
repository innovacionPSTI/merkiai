/**
 * Control plane · Presets aplicables a un tenant (HU-236).
 *
 * Lo consume el **onboarding del admin**: el admin (plano de tienda) no ve la BD
 * de plataforma donde viven los presets, así que pide aquí los presets del plan
 * del tenant + los topes ya resueltos (categorías/productos) y si el plan habilita
 * multi-ubicación. Con eso el admin aplica el preset a su propio store DB (HU-235).
 *
 * Auth: `x-internal-secret` (server-to-server). Solo lectura.
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/platform-db'
import { hasInternalSecret } from '@/lib/auth'
import { getPresetsForPlan } from '@/lib/presets'
import { resolveLimit, resolveFeature, LIMITS, FEATURES } from '@merkiai/tenancy'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasInternalSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const db = platformDb()
  const { data: tenant } = await db.from('tenants').select('plan').eq('id', id).maybeSingle()
  if (!tenant) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { data: plan } = await db
    .from('plans').select('features, limits').eq('key', tenant.plan).maybeSingle()
  const entitlements = { features: plan?.features ?? {}, limits: plan?.limits ?? {} }

  const presets = await getPresetsForPlan(tenant.plan)

  return NextResponse.json({
    plan: tenant.plan,
    presets,
    limits: {
      categories: resolveLimit(entitlements, LIMITS.CATEGORIES),
      products: resolveLimit(entitlements, LIMITS.PRODUCTS),
    },
    allowMultiLocation: resolveFeature(entitlements, FEATURES.MULTI_LOCATION),
  })
}
