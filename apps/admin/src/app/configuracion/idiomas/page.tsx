import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { listMarkets, listPriceLists, enabledLocales, MULTI_CURRENCY_ENABLED } from '@merkiai/database'
import { SUPPORTED_LOCALES, LOCALE_INFO } from '@merkiai/i18n'
import { requireMarkets } from '@/lib/markets'
import MarketsManager from './MarketsManager'

export const metadata: Metadata = { title: 'Idiomas y mercados · Configuración' }
export const dynamic = 'force-dynamic'

/** E28 · HU-461 · idiomas y mercados de la tienda (ADR-011). */
export default async function IdiomasMercadosPage() {
  const { db, tenantId, rules, priceListsEnabled } = await requireMarkets()
  const [markets, priceLists] = await Promise.all([
    listMarkets(db, tenantId),
    priceListsEnabled ? listPriceLists(db).catch(() => []) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Idiomas y mercados"
        description="Elige en qué idiomas y para qué países vende tu tienda. Cada mercado agrupa países, idiomas, lista de precios y, si quieres, un dominio propio."
      />
      <MarketsManager
        markets={markets}
        locales={SUPPORTED_LOCALES.map((l) => ({ code: l, label: LOCALE_INFO[l].label }))}
        priceLists={priceLists.map((p) => ({ id: p.id, name: p.name }))}
        rules={{ ...rules, multiCurrency: MULTI_CURRENCY_ENABLED }}
        usedLanguages={enabledLocales(markets).length}
      />
    </div>
  )
}
