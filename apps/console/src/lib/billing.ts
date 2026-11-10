/**
 * Billing SaaS en el CONSOLE (HU-440 · ADR-009). Orquesta el núcleo puro de
 * `@merkiai/tenancy` (máquina de estados + adaptador PayZen) con la BD de
 * plataforma, el vault y el correo. Todo inyectado → testeable sin red.
 *
 *  - `processBillingWebhook`: IPN verificada → evento idempotente → transición →
 *    persiste suscripción + `tenants.status` → token al vault → correos.
 *  - `startCheckout`: crea/actualiza la suscripción del tenant y pide el formToken.
 *  - `sweepDunning`: suspende las suscripciones en mora cuya gracia venció (cron).
 */
import {
  applyBillingEvent, shouldSuspend, DEFAULT_DUNNING,
  type BillingEffect, type BillingInterval, type BillingProvider, type DunningPolicy,
  type SecretsVault, type SubscriptionState, type SubscriptionStatus,
} from '@merkiai/tenancy'

export interface SubscriptionRow {
  tenant_id: string
  plan: string
  billing_interval: BillingInterval
  amount_cents: number
  currency: string
  status: SubscriptionStatus
  provider_subscription_id: string | null
  payment_token_ref: string | null
  current_period_end: string | null
  past_due_since: string | null
  failed_attempts: number
}

export interface BillingRepo {
  /** Inserta el evento; `duplicate` si (provider, event_key) ya existía. */
  insertEvent(e: { tenantId: string | null; provider: string; eventKey: string; type: string; amountCents: number | null; currency: string | null; payload: unknown }): Promise<'inserted' | 'duplicate'>
  deleteEvent(provider: string, eventKey: string): Promise<void>
  getSubscription(tenantId: string): Promise<SubscriptionRow | null>
  upsertSubscription(row: Partial<SubscriptionRow> & { tenant_id: string }): Promise<void>
  setTenantStatus(tenantId: string, status: SubscriptionStatus): Promise<void>
  getTenantContact(tenantId: string): Promise<{ name: string; email: string | null; plan: string } | null>
  getPlan(key: string): Promise<{ key: string; name: string; price_cents: number; currency: string } | null>
  listPastDue(): Promise<SubscriptionRow[]>
  listEvents(tenantId: string, limit: number): Promise<BillingEventRow[]>
}

export interface BillingEventRow { type: string; amount_cents: number | null; currency: string | null; created_at: string }

export type BillingEmailTemplate = Extract<BillingEffect, { kind: 'email' }>['template']
export interface BillingMailer {
  send(to: string, template: BillingEmailTemplate, ctx: { tenantName: string; amountCents: number; currency: string; periodEnd: string | null }): Promise<void>
}

export interface BillingDeps {
  repo: BillingRepo
  provider: BillingProvider
  vault: SecretsVault
  mailer: BillingMailer
  policy?: DunningPolicy
  now?: () => Date
  log?: (msg: string, extra?: unknown) => void
}

// ─── Puros ────────────────────────────────────────────────────────────────────

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** `sub-<tenantId>-<yyyymmddhhmmss>`: ≤ 64 chars y solo [a-zA-Z0-9_-] (límite PayZen). */
export function buildOrderId(tenantId: string, at: Date): string {
  return `sub-${tenantId}-${at.toISOString().replace(/\D/g, '').slice(0, 14)}`
}
/** Respaldo cuando la IPN recurrente no trae `metadata.tenantId`. */
export function tenantIdFromOrderId(orderId: string | null): string | null {
  return orderId?.match(new RegExp(`^sub-(${UUID})(?:-|$)`, 'i'))?.[1]?.toLowerCase() ?? null
}

export function toState(r: SubscriptionRow): SubscriptionState {
  return { status: r.status, interval: r.billing_interval, currentPeriodEnd: r.current_period_end, pastDueSince: r.past_due_since, failedAttempts: r.failed_attempts }
}
function toPatch(s: SubscriptionState) {
  return { status: s.status, current_period_end: s.currentPeriodEnd, past_due_since: s.pastDueSince, failed_attempts: s.failedAttempts }
}

/** Fecha de inicio de la recurrencia: medianoche UTC del fin de período (formato PayZen). */
export function effectDateOf(periodEnd: string): string {
  return `${periodEnd.slice(0, 10)}T00:00:00+00:00`
}

// ─── Efectos ──────────────────────────────────────────────────────────────────

async function runEffects(
  deps: Pick<BillingDeps, 'repo' | 'mailer' | 'log'>,
  sub: SubscriptionRow,
  state: SubscriptionState,
  effects: BillingEffect[],
) {
  const contact = effects.some((e) => e.kind === 'email') ? await deps.repo.getTenantContact(sub.tenant_id) : null
  for (const e of effects) {
    if (e.kind === 'set_tenant_status') { await deps.repo.setTenantStatus(sub.tenant_id, e.status); continue }
    if (!contact?.email) continue
    // El correo es best-effort: un fallo de envío no debe reprocesar el cobro.
    try {
      await deps.mailer.send(contact.email, e.template, { tenantName: contact.name, amountCents: sub.amount_cents, currency: sub.currency, periodEnd: state.currentPeriodEnd })
    } catch (err) { deps.log?.(`[billing] correo ${e.template} falló`, err) }
  }
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export type WebhookResult =
  | { status: 'processed'; tenantId: string; subscription: SubscriptionStatus }
  | { status: 'duplicate' | 'pending' | 'unknown_tenant' | 'no_subscription' }

/** Lanza si la firma es inválida (→ 401) o si falla la persistencia (→ 500, el proveedor reintenta). */
export async function processBillingWebhook(deps: BillingDeps, fields: Record<string, string>): Promise<WebhookResult> {
  const hook = deps.provider.parseWebhook(fields)
  if (hook.outcome === 'pending') return { status: 'pending' }

  const tenantId = hook.tenantId ?? tenantIdFromOrderId(hook.orderId)
  const provider = deps.provider.id
  const type = hook.outcome === 'succeeded' ? 'payment_succeeded' : 'payment_failed'
  // El payload guardado NO incluye el token del medio de pago.
  const inserted = await deps.repo.insertEvent({
    tenantId, provider, eventKey: hook.eventKey, type, amountCents: hook.amountCents, currency: hook.currency, payload: { orderId: hook.orderId },
  })
  if (inserted === 'duplicate') return { status: 'duplicate' }
  if (!tenantId) return { status: 'unknown_tenant' }

  try {
    const sub = await deps.repo.getSubscription(tenantId)
    if (!sub) return { status: 'no_subscription' }
    const at = (deps.now?.() ?? new Date()).toISOString()
    const { state, effects } = applyBillingEvent(toState(sub), { type, at }, deps.policy ?? DEFAULT_DUNNING)

    const patch: Partial<SubscriptionRow> = toPatch(state)
    if (hook.paymentToken) {
      if (sub.payment_token_ref) await deps.vault.rotate(sub.payment_token_ref, hook.paymentToken)
      else patch.payment_token_ref = await deps.vault.put(`billing/${tenantId}/payment-token`, hook.paymentToken)
    }
    await deps.repo.upsertSubscription({ tenant_id: tenantId, ...patch })
    await runEffects(deps, sub, state, effects)

    // Primer cobro con token → crear la recurrencia. No fatal: queda registrado y reintentable.
    if (type === 'payment_succeeded' && hook.paymentToken && !sub.provider_subscription_id && state.currentPeriodEnd) {
      try {
        const { subscriptionId } = await deps.provider.createSubscription({
          tenantId, orderId: buildOrderId(tenantId, new Date(at)), amountCents: sub.amount_cents, currency: sub.currency,
          paymentToken: hook.paymentToken, interval: sub.billing_interval, effectDate: effectDateOf(state.currentPeriodEnd),
        })
        await deps.repo.upsertSubscription({ tenant_id: tenantId, provider_subscription_id: subscriptionId })
      } catch (err) {
        deps.log?.('[billing] no se pudo crear la recurrencia', err)
        await deps.repo.insertEvent({
          tenantId, provider, eventKey: `${hook.eventKey}:recurrence_failed`, type: 'recurrence_setup_failed',
          amountCents: null, currency: null, payload: { error: String((err as Error)?.message ?? err) },
        })
      }
    }
    return { status: 'processed', tenantId, subscription: state.status }
  } catch (err) {
    // Libera la clave de idempotencia para que el reintento del proveedor sí procese.
    await deps.repo.deleteEvent(provider, hook.eventKey).catch(() => undefined)
    throw err
  }
}

// ─── Checkout (alta / cambio de medio de pago) ────────────────────────────────

export async function startCheckout(
  deps: Pick<BillingDeps, 'repo' | 'provider' | 'now'>,
  input: { tenantId: string; interval?: BillingInterval },
): Promise<{ formToken: string; orderId: string; amountCents: number; currency: string }> {
  const contact = await deps.repo.getTenantContact(input.tenantId)
  if (!contact) throw new Error('tenant_not_found')
  if (!contact.email) throw new Error('owner_email_missing')
  const plan = await deps.repo.getPlan(contact.plan)
  if (!plan) throw new Error('plan_not_found')
  if (plan.price_cents <= 0) throw new Error('plan_is_free')

  const interval = input.interval ?? 'monthly'
  const amountCents = interval === 'yearly' ? plan.price_cents * 12 : plan.price_cents
  const existing = await deps.repo.getSubscription(input.tenantId)
  await deps.repo.upsertSubscription({
    tenant_id: input.tenantId, plan: plan.key, billing_interval: interval, amount_cents: amountCents, currency: plan.currency,
    ...(existing ? {} : { status: 'trialing' as const }),
  })
  const orderId = buildOrderId(input.tenantId, deps.now?.() ?? new Date())
  const { formToken } = await deps.provider.createRegisterAndPay({ tenantId: input.tenantId, orderId, amountCents, currency: plan.currency, email: contact.email })
  return { formToken, orderId, amountCents, currency: plan.currency }
}

// ─── Barrido de mora (cron) ───────────────────────────────────────────────────

/** Suspende las suscripciones `past_due` cuya política se agotó sin nuevos eventos. */
export async function sweepDunning(deps: Pick<BillingDeps, 'repo' | 'mailer' | 'policy' | 'now' | 'log'>): Promise<{ suspended: string[] }> {
  const at = (deps.now?.() ?? new Date()).toISOString()
  const suspended: string[] = []
  for (const sub of await deps.repo.listPastDue()) {
    const state = toState(sub)
    if (!shouldSuspend(state, at, deps.policy ?? DEFAULT_DUNNING)) continue
    const next: SubscriptionState = { ...state, status: 'suspended' }
    await deps.repo.upsertSubscription({ tenant_id: sub.tenant_id, status: 'suspended' })
    await runEffects(deps, sub, next, [{ kind: 'set_tenant_status', status: 'suspended' }, { kind: 'email', template: 'suspended' }])
    suspended.push(sub.tenant_id)
  }
  return { suspended }
}

// ─── Resumen para el admin del tenant / consola ───────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  payment_succeeded: 'Pago aprobado',
  payment_failed: 'Pago rechazado',
  recurrence_setup_failed: 'No se pudo programar el cobro automático',
}

export interface BillingSummary {
  plan: { key: string; name: string; priceCents: number; currency: string } | null
  subscription: {
    status: SubscriptionStatus
    interval: BillingInterval
    amountCents: number
    currency: string
    currentPeriodEnd: string | null
    pastDueSince: string | null
    failedAttempts: number
    hasPaymentMethod: boolean
    autoRenew: boolean
  } | null
  events: { label: string; amountCents: number | null; currency: string | null; at: string }[]
}

/** Resumen SIN secretos (nunca expone token ni su referencia). */
export async function getBillingSummary(repo: BillingRepo, tenantId: string): Promise<BillingSummary | null> {
  const contact = await repo.getTenantContact(tenantId)
  if (!contact) return null
  const [plan, sub, events] = await Promise.all([repo.getPlan(contact.plan), repo.getSubscription(tenantId), repo.listEvents(tenantId, 10)])
  return {
    plan: plan ? { key: plan.key, name: plan.name, priceCents: plan.price_cents, currency: plan.currency } : null,
    subscription: sub ? {
      status: sub.status, interval: sub.billing_interval, amountCents: sub.amount_cents, currency: sub.currency,
      currentPeriodEnd: sub.current_period_end, pastDueSince: sub.past_due_since, failedAttempts: sub.failed_attempts,
      hasPaymentMethod: Boolean(sub.payment_token_ref), autoRenew: Boolean(sub.provider_subscription_id),
    } : null,
    events: events.map((e) => ({ label: EVENT_LABEL[e.type] ?? e.type, amountCents: e.amount_cents, currency: e.currency, at: e.created_at })),
  }
}
