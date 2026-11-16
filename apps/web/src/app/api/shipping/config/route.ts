import { NextResponse } from 'next/server'
import { getShippingConfig, amountIn } from '@merkiai/database';
import { getApiPricing } from '@/lib/request-pricing'
import { resolveTenant } from '@/lib/tenant-context';
import { getMachineDb } from '@/lib/machine-db'

/**
 * GET /api/shipping/config
 *
 * Devuelve la configuración de envío pública (sin credenciales).
 * Usada por el carrito y el checkout para mostrar costos reales
 * sin exponer secrets de Skydropx.
 */
export async function GET() {
  try {
    const { tenantId } = await resolveTenant();
    const config = await getShippingConfig(getMachineDb(tenantId), tenantId)
    // HU-467 · montos en la moneda del mercado de la visita; la transportadora
    // cotiza en la moneda base, así que en otra moneda rige la tarifa fija.
    const pricing = await getApiPricing(tenantId)
    const market = pricing.market
    return NextResponse.json({
      provider:                 pricing.converting ? 'fixed' : config.provider,
      fixed_rate:               amountIn(pricing, config.fixed_rate) ?? config.fixed_rate,
      free_shipping_enabled:    config.free_shipping_enabled,
      free_shipping_min_amount: amountIn(pricing, config.free_shipping_min_amount) ?? config.free_shipping_min_amount,
      currency:                 pricing.currency,
      tax: { rate: market?.tax_rate ?? 0, included: market?.tax_included ?? true },
    })
  } catch {
    // Fallback seguro si la BD no responde
    return NextResponse.json({
      provider:                 'fixed',
      fixed_rate:               8000,
      free_shipping_enabled:    true,
      free_shipping_min_amount: 100000,
    })
  }
}
