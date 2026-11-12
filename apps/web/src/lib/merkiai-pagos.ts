/**
 * "Merkiai Pagos" en el storefront (HU-441). La instancia `merkiai_pagos` no
 * guarda credenciales en la BD de la tienda: se piden a la consola (que las
 * descifra del vault) en cada cobro/IPN y solo viven en memoria.
 */
import type { ActivePayment } from '@merkiai/database'
import { consoleUrl } from './console-url'

export const MERKIAI_PAGOS = 'merkiai_pagos'

/** Método de pago / ruta de webhook real: Merkiai Pagos ES PayZen. */
export function gatewayMethod(provider: string): string {
  return provider === MERKIAI_PAGOS ? 'payzen' : provider
}

function endpoint(path: string): { url: string; headers: Record<string, string> } | null {
  const base = consoleUrl()
  const secret = process.env.INTERNAL_API_SECRET
  if (!base || !secret) return null
  return { url: `${base.replace(/\/$/, '')}${path}`, headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret } }
}

/**
 * Completa las credenciales de una instancia gestionada. Para cualquier otro
 * proveedor devuelve `active` tal cual. Lanza si Merkiai Pagos no está activo en
 * la consola o no responde (fail-closed: no se cobra sin credenciales válidas).
 */
export async function hydrateManagedPayment(active: ActivePayment | null, tenantId: string, fetchImpl: typeof fetch = fetch): Promise<ActivePayment | null> {
  if (!active || active.provider !== MERKIAI_PAGOS) return active
  const ep = endpoint(`/api/internal/tenants/${tenantId}/payments/merkiai`)
  if (!ep) throw new Error('Merkiai Pagos: la consola no está configurada en este entorno.')
  const res = await fetchImpl(ep.url, { headers: ep.headers, cache: 'no-store' })
  const body = (await res.json().catch(() => null)) as { active?: boolean; environment?: 'test' | 'production'; credentials?: { shop_id?: string; password?: string } } | null
  if (!res.ok || !body?.active || !body.credentials?.shop_id || !body.credentials?.password) {
    throw new Error('Merkiai Pagos aún no está activo para esta tienda.')
  }
  return { ...active, environment: body.environment ?? active.environment, credentials: { shop_id: body.credentials.shop_id, password: body.credentials.password } }
}

/** Causa la comisión de una venta aprobada en la consola. `true` si quedó registrada (o ya lo estaba). */
export async function reportMerkiaiFee(
  tenantId: string,
  sale: { paymentId: string; orderNumber: string; amountCents: number; currency?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const ep = endpoint(`/api/internal/tenants/${tenantId}/payments/merkiai/fees`)
  if (!ep) return false
  try {
    const res = await fetchImpl(ep.url, { method: 'POST', headers: ep.headers, body: JSON.stringify({ currency: 'COP', ...sale }), cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}
