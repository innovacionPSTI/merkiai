import { NextResponse } from 'next/server'
import { resolveActivePayment, TuCompraGateway } from '@merkiai/database';
import { resolveTenant } from '@/lib/tenant-context';
import { getMachineDb } from '@/lib/machine-db'

type MethodCfg = { tipo: string; id: string; enabled?: boolean }

/**
 * GET /api/checkout/tucompra/banks
 * Lista de bancos PSE para el selector del checkout. El id de método PSE se toma
 * de la config (`tucompra_methods`, difiere demo/prod). Público (solo lectura).
 */
export async function GET() {
  try {
    const { tenantId } = await resolveTenant();
    const active = await resolveActivePayment(getMachineDb(tenantId), tenantId).catch(() => null)
    if (!active || active.provider !== 'tucompra' || !active.credentials.user || !active.credentials.password || !active.credentials.terminal) {
      return NextResponse.json({ banks: [] })
    }
    const methods = (Array.isArray(active.settings.methods) ? active.settings.methods : []) as MethodCfg[]
    const pse = methods.find((m) => m.tipo === 'pse' && m.enabled !== false)
    if (!pse?.id) return NextResponse.json({ banks: [] })

    const gateway = new TuCompraGateway({
      usuario:  active.credentials.user,
      clave:    active.credentials.password,
      terminal: active.credentials.terminal,
      apiUrl:   (active.settings.api_url as string | undefined) ?? undefined,
    })
    const banks = await gateway.listarBancos(pse.id)
    return NextResponse.json({ banks })
  } catch (err) {
    console.error('[checkout/tucompra/banks]', err)
    return NextResponse.json({ banks: [] })
  }
}
