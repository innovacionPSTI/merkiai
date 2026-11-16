'use client'

/**
 * E28 · HU-467 · mantiene el carrito en la moneda del mercado de la visita.
 * Si alguna línea quedó en otra moneda (cambio de mercado, carrito guardado en la
 * cuenta), pide sus precios convertidos y los aplica; las líneas sin precio en
 * esa moneda se quitan. El checkout recalcula todo en el servidor igualmente.
 */
import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { useCurrency, useLocale } from '@/components/i18n/I18nProvider'

export default function CartCurrencySync() {
  const currency = useCurrency()
  const locale = useLocale()
  const items = useCartStore((s) => s.items)
  const setCurrency = useCartStore((s) => s.setCurrency)
  const applyPrices = useCartStore((s) => s.applyPrices)

  const stale = items.filter((i) => (i.currency ?? 'COP') !== currency)
  const staleKey = stale.map((i) => i.variantId).join(',')

  useEffect(() => {
    setCurrency(currency)
    if (stale.length === 0) return
    let cancelled = false
    const variantIds = stale.filter((i) => !i.bundleId).map((i) => i.variantId)
    const bundleIds = stale.filter((i) => i.bundleId).map((i) => i.bundleId as number)
    fetch('/api/cart/reprice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, variantIds, bundleIds }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { currency: string; prices: Record<string, number | null>; bundles: Record<string, number | null> } | null) => {
        if (!d || cancelled || d.currency !== currency) return
        const prices: Record<string, number | null> = { ...d.prices }
        for (const i of stale) if (i.bundleId) prices[String(i.variantId)] = d.bundles[String(i.bundleId)] ?? null
        applyPrices(currency, prices)
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, staleKey])

  return null
}
