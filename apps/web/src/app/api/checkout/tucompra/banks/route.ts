import { NextResponse } from 'next/server'
import { getPaymentConfig, TuCompraGateway } from '@vps/database'

type MethodCfg = { tipo: string; id: string; enabled?: boolean }

/**
 * GET /api/checkout/tucompra/banks
 * Lista de bancos PSE para el selector del checkout. El id de método PSE se toma
 * de la config (`tucompra_methods`, difiere demo/prod). Público (solo lectura).
 */
export async function GET() {
  try {
    const config = await getPaymentConfig().catch(() => null)
    if (!config?.tucompra_user || !config.tucompra_password || !config.tucompra_terminal) {
      return NextResponse.json({ banks: [] })
    }
    const methods = (Array.isArray(config.tucompra_methods) ? config.tucompra_methods : []) as MethodCfg[]
    const pse = methods.find((m) => m.tipo === 'pse' && m.enabled !== false)
    if (!pse?.id) return NextResponse.json({ banks: [] })

    const gateway = new TuCompraGateway({
      usuario:  config.tucompra_user,
      clave:    config.tucompra_password,
      terminal: config.tucompra_terminal,
      apiUrl:   config.tucompra_api_url ?? undefined,
    })
    const banks = await gateway.listarBancos(pse.id)
    return NextResponse.json({ banks })
  } catch (err) {
    console.error('[checkout/tucompra/banks]', err)
    return NextResponse.json({ banks: [] })
  }
}
