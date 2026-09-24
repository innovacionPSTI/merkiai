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
import { createServerClient, seedTenantConfig } from '@merkiai/database'
import { withInternalAuth } from '@/lib/internal-route'

export const POST = withInternalAuth(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as { tenantId?: string; storeName?: string }
  const tenantId = String(body.tenantId ?? '').trim()
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 })
  }

  try {
    const res = await seedTenantConfig(tenantId, { storeName: body.storeName }, createServerClient())
    const hasErr = Object.values(res.results).some((v) => v !== 'ok')
    return NextResponse.json(res, { status: hasErr ? 207 : 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al sembrar config' }, { status: 500 })
  }
})
