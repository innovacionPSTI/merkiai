/**
 * @merkiai/tenancy — Núcleo de billing SaaS (HU-440 · ADR-009). PURO.
 *
 * Máquina de estados de la suscripción de un tenant, independiente del proveedor:
 * recibe eventos normalizados (pago ok / pago fallido / cancelación) y devuelve el
 * nuevo estado + los efectos a ejecutar (cambiar estado del tenant, enviar correo).
 * No toca BD ni red: quien la llama persiste y ejecuta los efectos.
 */
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled'
export type BillingInterval = 'monthly' | 'yearly'

export interface SubscriptionState {
  status: SubscriptionStatus
  interval: BillingInterval
  currentPeriodEnd: string | null // ISO
  pastDueSince: string | null     // ISO
  failedAttempts: number
}

/** Política de cobranza (dunning). Configurable; nada cableado. */
export interface DunningPolicy {
  /** Intentos fallidos consecutivos antes de suspender. */
  maxAttempts: number
  /** Días de gracia desde el primer fallo antes de suspender. */
  graceDays: number
}
export const DEFAULT_DUNNING: DunningPolicy = { maxAttempts: 3, graceDays: 7 }

export type BillingEvent =
  | { type: 'payment_succeeded'; at: string }
  | { type: 'payment_failed'; at: string }
  | { type: 'canceled'; at: string }

export type BillingEffect =
  | { kind: 'set_tenant_status'; status: SubscriptionStatus }
  | { kind: 'email'; template: 'activated' | 'receipt' | 'payment_failed' | 'suspended' | 'reactivated' | 'canceled' }

export interface BillingTransition { state: SubscriptionState; effects: BillingEffect[] }

/** Fin del período siguiente a `from` según el ciclo. Puro (UTC). */
export function nextPeriodEnd(from: string, interval: BillingInterval): string {
  const d = new Date(from)
  if (interval === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString()
}

const DAY_MS = 86_400_000

/** ¿Debe suspenderse según la política? (intentos agotados o gracia vencida). */
export function shouldSuspend(state: SubscriptionState, at: string, policy: DunningPolicy): boolean {
  if (state.failedAttempts >= policy.maxAttempts) return true
  if (!state.pastDueSince) return false
  return new Date(at).getTime() - new Date(state.pastDueSince).getTime() >= policy.graceDays * DAY_MS
}

/**
 * Aplica un evento a la suscripción. Reglas:
 *  - pago ok → `active`, renueva período, limpia mora. Correo: activación (1ª vez),
 *    reactivación (venía de mora/suspensión) o recibo (renovación normal).
 *  - pago fallido → `past_due` (cuenta el intento); si la política se agota → `suspended`.
 *  - cancelación → `canceled`.
 * Una suscripción `canceled` no revive por un pago tardío (requiere alta nueva).
 */
export function applyBillingEvent(
  prev: SubscriptionState,
  event: BillingEvent,
  policy: DunningPolicy = DEFAULT_DUNNING,
): BillingTransition {
  if (prev.status === 'canceled') return { state: prev, effects: [] }

  if (event.type === 'canceled') {
    return {
      state: { ...prev, status: 'canceled' },
      effects: [{ kind: 'set_tenant_status', status: 'canceled' }, { kind: 'email', template: 'canceled' }],
    }
  }

  if (event.type === 'payment_succeeded') {
    const base = prev.currentPeriodEnd && new Date(prev.currentPeriodEnd) > new Date(event.at) ? prev.currentPeriodEnd : event.at
    const state: SubscriptionState = {
      ...prev, status: 'active', currentPeriodEnd: nextPeriodEnd(base, prev.interval), pastDueSince: null, failedAttempts: 0,
    }
    const template = prev.status === 'trialing' ? 'activated'
      : prev.status === 'past_due' || prev.status === 'suspended' ? 'reactivated' : 'receipt'
    const effects: BillingEffect[] = []
    if (prev.status !== 'active') effects.push({ kind: 'set_tenant_status', status: 'active' })
    effects.push({ kind: 'email', template })
    return { state, effects }
  }

  // payment_failed
  const failed: SubscriptionState = {
    ...prev, failedAttempts: prev.failedAttempts + 1, pastDueSince: prev.pastDueSince ?? event.at,
    status: prev.status === 'suspended' ? 'suspended' : 'past_due',
  }
  if (failed.status !== 'suspended' && shouldSuspend(failed, event.at, policy)) {
    return {
      state: { ...failed, status: 'suspended' },
      effects: [{ kind: 'set_tenant_status', status: 'suspended' }, { kind: 'email', template: 'suspended' }],
    }
  }
  const effects: BillingEffect[] = []
  if (prev.status !== failed.status) effects.push({ kind: 'set_tenant_status', status: failed.status })
  if (failed.status === 'past_due') effects.push({ kind: 'email', template: 'payment_failed' })
  return { state: failed, effects }
}

// ─── Contrato del proveedor (intercambiable: PayZen · MercadoPago · Stripe) ───

/** Evento de webhook ya verificado y normalizado. */
export interface NormalizedBillingWebhook {
  /** Clave de idempotencia (id de transacción del proveedor). */
  eventKey: string
  tenantId: string | null
  outcome: 'succeeded' | 'failed' | 'pending'
  amountCents: number | null
  currency: string | null
  /** Token del medio de pago (si el proveedor lo devuelve al registrar). Secreto. */
  paymentToken: string | null
  orderId: string | null
}

export interface BillingProvider {
  readonly id: string
  /** Inicia registro del medio de pago + primer cobro; devuelve el token de formulario. */
  createRegisterAndPay(input: { tenantId: string; orderId: string; amountCents: number; currency: string; email: string }): Promise<{ formToken: string }>
  /** Crea la recurrencia en el proveedor a partir de un token ya registrado. */
  createSubscription(input: { tenantId: string; orderId: string; amountCents: number; currency: string; paymentToken: string; interval: BillingInterval; effectDate: string }): Promise<{ subscriptionId: string }>
  /** Cobro puntual con token (reintentos manuales/controlados). */
  chargeToken(input: { tenantId: string; orderId: string; amountCents: number; currency: string; paymentToken: string }): Promise<{ outcome: 'succeeded' | 'failed' | 'pending'; transactionId: string | null }>
  cancelSubscription(input: { paymentToken: string; subscriptionId: string }): Promise<void>
  /** Verifica firma y normaliza el webhook. Lanza si la firma es inválida. */
  parseWebhook(fields: Record<string, string>): NormalizedBillingWebhook
}
