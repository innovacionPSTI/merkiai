import { NextResponse } from 'next/server'
import { listMarkets, enabledLocales, storeDefaultLocale } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

/**
 * Configuración de idiomas de la tienda (E28 · HU-462) para el middleware:
 * locale por defecto, locales publicables y dominios ligados a un mercado. El
 * middleware la cachea en memoria por host (60 s). Fail-safe: un solo idioma.
 */
export const revalidate = 60

export async function GET() {
  try {
    const { tenantId } = await resolveTenant()
    const markets = await listMarkets(getMachineDb(tenantId), tenantId)
    return NextResponse.json({
      defaultLocale: storeDefaultLocale(markets),
      locales: enabledLocales(markets),
      domains: markets.filter((m) => m.active && m.domain).map((m) => ({ domain: m.domain as string, locale: m.default_locale })),
    })
  } catch {
    return NextResponse.json({ defaultLocale: 'es-CO', locales: ['es-CO'], domains: [] })
  }
}
