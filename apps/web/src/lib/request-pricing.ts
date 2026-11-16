/**
 * Precios en la moneda del mercado de la visita (E28 · HU-467).
 *
 * Páginas: el mercado sale del locale que fija el middleware (`x-locale`) y del
 * host (mercado con dominio propio). APIs: del locale que envía el cliente o de
 * la cookie de idioma. Sin multimoneda configurada todo queda en la moneda base
 * (contexto neutro, sin consultas extra a la lista de precios).
 */
import { cache } from 'react'
import { headers, cookies } from 'next/headers'
import { normalizeLocale } from '@merkiai/i18n'
import { getPricingContext, basePricingContext, localizeProductPrices, amountIn, priceIn, type PricingContext } from '@merkiai/database'
import { resolveTenant } from './tenant-context'
import { getMachineDb } from './machine-db'
import { LOCALE_COOKIE } from './locale-routing'

function hostOf(h: Headers): string {
  return (h.get('x-forwarded-host') ?? h.get('host') ?? '').toLowerCase()
}

/** Contexto de precios de la página actual (una vez por petición). */
export const getRequestPricing = cache(async (): Promise<PricingContext> => {
  try {
    const h = await headers()
    const { tenantId } = await resolveTenant()
    return await getPricingContext(getMachineDb(tenantId), tenantId, { locale: normalizeLocale(h.get('x-locale')), host: hostOf(h) })
  } catch {
    return basePricingContext()
  }
})

/** Contexto de precios para una API del storefront (locale del cuerpo o de la cookie). */
export async function getApiPricing(tenantId: string, locale?: string | null): Promise<PricingContext> {
  try {
    const h = await headers()
    const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value ?? null
    return await getPricingContext(getMachineDb(tenantId), tenantId, { locale: normalizeLocale(locale ?? fromCookie), host: hostOf(h) })
  } catch {
    return basePricingContext()
  }
}

/** Filas de producto con los precios en la moneda de la visita. */
export async function localizePrices<T>(rows: T[]): Promise<T[]> {
  const ctx = await getRequestPricing()
  return ctx.converting ? localizeProductPrices(rows, ctx) : rows
}

/** Moneda en que se muestran los precios de la página (para el proveedor de formato). */
export async function getRequestCurrency(): Promise<string> {
  return (await getRequestPricing()).currency
}

/**
 * Bundle en la moneda de la visita: el precio del kit se convierte con la tasa
 * (los kits no están en listas de precio) y los componentes con su precio local.
 * `null` si no se puede vender en esa moneda.
 */
export async function localizeBundle<B extends { price: number; components?: Array<{ variant_id: number; price?: number }> }>(bundle: B): Promise<B | null> {
  const ctx = await getRequestPricing()
  if (!ctx.converting) return bundle
  const price = amountIn(ctx, bundle.price)
  if (price == null) return null
  const components = bundle.components?.map((c) => ({ ...c, price: c.price == null ? c.price : (priceIn(ctx, { basePrice: c.price, variantId: c.variant_id }) ?? undefined) }))
  return { ...bundle, price, ...(components ? { components } : {}) }
}
