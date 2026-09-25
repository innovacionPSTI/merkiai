/**
 * POST /api/internal/tenants/purge — Des-aprovisiona un tenant (HU-209 · borrado).
 *
 * Lo invoca la **consola** al eliminar un tenant: borra TODOS los datos del plano
 * de tienda (config, contenido, catálogo, pedidos, clientes, perfiles) de ese
 * `tenant_id`. La fila `tenants` (plataforma) y el Team (Stack Auth) los borra la
 * consola. Irreversible.
 *
 * Auth: `withInternalAuth`. service-role legítimo (control plane; toca todas las
 * tablas del tenant, sin sesión de dueño).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, purgeTenantData } from '@merkiai/database'
import { withInternalAuth } from '@/lib/internal-route'

export const POST = withInternalAuth(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as { tenantId?: string }
  const tenantId = String(body.tenantId ?? '').trim()
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId es requerido' }, { status: 400 })
  }
  try {
    const res = await purgeTenantData(tenantId, createServerClient())
    const hasErr = Object.values(res.results).some((v) => v !== 'ok')
    return NextResponse.json(res, { status: hasErr ? 207 : 200 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al purgar' }, { status: 500 })
  }
})
