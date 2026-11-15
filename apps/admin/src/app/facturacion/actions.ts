'use server'

import { localizeForPanel } from '@/lib/server-i18n'
import { getAdminUser } from '@/lib/auth'
import { canManageBilling, startBillingCheckout, type CheckoutSession } from '@/lib/billing'

/** Pide a la consola un `formToken` de PayZen para pagar el plan de la tienda activa. */
async function startCheckoutAction__impl(
  interval: 'monthly' | 'yearly',
): Promise<{ ok: true; session: CheckoutSession } | { ok: false; error: string }> {
  const u = await getAdminUser()
  if (!u || !canManageBilling(u.role)) return { ok: false, error: 'Solo el administrador de la tienda puede gestionar el pago.' }
  return startBillingCheckout(u.tenantId, interval === 'yearly' ? 'yearly' : 'monthly')
}

// HU-466 F6 · los mensajes de cada acción vuelven en el idioma del panel.
export async function startCheckoutAction(...args: Parameters<typeof startCheckoutAction__impl>): ReturnType<typeof startCheckoutAction__impl> {
  return localizeForPanel(await startCheckoutAction__impl(...args))
}
