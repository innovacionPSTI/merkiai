/**
 * Dirección de envío del checkout por país (E28 · HU-468). PURO: lo usa la API
 * de checkout como barrera server-side con las mismas reglas que el formulario.
 *
 * Colombia conserva su comportamiento histórico (sin validación adicional del
 * teléfono ni del CP más allá de la existente): AC-5, cero regresión.
 */
import { validateAddress, normalizePhone, normalizePostalCode, createTranslator, isSupportedCountry, DEFAULT_COUNTRY } from '@merkiai/i18n'

import type { ShippingAddress } from '@merkiai/database'

/** Snapshot inmutable que se guarda en `orders.shipping_addr`. */
export type ShippingSnapshot = ShippingAddress & { country: string }

export type SanitizeResult =
  | { ok: true; address: ShippingSnapshot; phoneE164: string | null }
  | { ok: false; error: string }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function sanitizeCheckoutAddress(raw: unknown, phone: unknown, allowedCountries: readonly string[], opts: { phoneRequired?: boolean } = {}): SanitizeResult {
  const t = createTranslator()
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const country = (str(a.country) || DEFAULT_COUNTRY).toUpperCase()
  if (!isSupportedCountry(country) || !allowedCountries.includes(country)) {
    return { ok: false, error: 'La tienda no hace envíos a ese país.' }
  }
  const phoneE164 = normalizePhone(str(phone), country)
  const base: ShippingSnapshot = {
    address: str(a.address),
    city: str(a.city),
    department: str(a.department),
    country,
  }
  const cp = normalizePostalCode(country, str(a.postal_code))
  if (cp) base.postal_code = cp
  if (country === DEFAULT_COUNTRY) {
    // Colombia: mismas reglas de siempre; solo se agrega el país y, si se puede, el E.164.
    return { ok: true, address: { ...base, ...(phoneE164 ? { phone_e164: phoneE164 } : {}) }, phoneE164 }
  }
  const neighborhood = str(a.neighborhood) || null
  // El teléfono es obligatorio en el checkout; en la libreta de direcciones es opcional.
  const phoneToCheck = opts.phoneRequired === false && !str(phone) ? undefined : str(phone)
  const errors = validateAddress({ country, address: base.address, city: base.city, department: base.department, neighborhood, postal_code: base.postal_code ?? '', phone: phoneToCheck })
  const first = Object.entries(errors)[0]
  if (first) {
    const field: Record<string, string> = { address: 'Dirección', city: 'Ciudad', department: 'Región', neighborhood: 'Barrio o colonia', postal_code: 'Código postal', phone: 'Teléfono' }
    return { ok: false, error: `${field[first[0]] ?? first[0]}: ${t(first[1])}` }
  }
  return { ok: true, address: { ...base, neighborhood, phone_e164: phoneE164 }, phoneE164 }
}
