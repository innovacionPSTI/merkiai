import { NextResponse } from 'next/server'
import { getPaymentConfig, getActiveGateways } from '@vps/database'

const GATEWAY_META: Record<string, { label: string; desc: string }> = {
  wompi:       { label: 'Wompi',       desc: 'Tarjeta débito/crédito, PSE, Bancolombia' },
  mercadopago: { label: 'MercadoPago', desc: 'Tarjeta, efectivo, Nequi, Daviplata' },
  tucompra:    { label: 'Tu Compra',   desc: 'Tarjeta, efectivo, Nequi, PSE' },
  bold:        { label: 'Bold',        desc: 'Tarjeta, PSE, Nequi, Botón Bancolombia' },
}

/**
 * GET /api/checkout/gateways
 * Returns the list of active payment gateways configured in payment_config.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    const config = await getPaymentConfig()
    if (!config) throw new Error('No payment config')
    const names  = getActiveGateways(config)

    const gateways = names.map((name) => ({
      value: name,
      label: GATEWAY_META[name]?.label ?? name,
      desc:  GATEWAY_META[name]?.desc  ?? '',
    }))

    // Sin pasarela activa → checkout en modo manual (validación del administrador).
    // No se expone ninguna pasarela; el pedido se creará como 'manual'.
    return NextResponse.json({ gateways, manual: gateways.length === 0 })
  } catch (err) {
    console.error('[checkout/gateways GET]', err)
    // Ante error de BD, degradar a modo manual (nunca inventar una pasarela activa).
    return NextResponse.json({ gateways: [], manual: true })
  }
}
