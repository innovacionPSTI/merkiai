'use server'

import { getAdminUser } from '@/lib/auth'
import { canManageBilling, startBillingCheckout, type CheckoutSession } from '@/lib/billing'

/** Pide a la consola un `formToken` de PayZen para pagar el plan de la tienda activa. */
export async function startCheckoutAction(
  interval: 'monthly' | 'yearly',
): Promise<{ ok: true; session: CheckoutSession } | { ok: false; error: string }> {
  const u = await getAdminUser()
  if (!u || !canManageBilling(u.role)) return { ok: false, error: 'Solo el administrador de la tienda puede gestionar el pago.' }
  return startBillingCheckout(u.tenantId, interval === 'yearly' ? 'yearly' : 'monthly')
}
