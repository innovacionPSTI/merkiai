/**
 * Ensamblaje de billing en el console (HU-440): repo sobre la BD de plataforma +
 * proveedor PayZen (env) + vault + mailer. Único punto con I/O real.
 */
import { createPayzenBillingProvider, type BillingProvider, type DunningPolicy } from '@merkiai/tenancy'
import { platformDb } from './platform-db'
import { getSecretsVault } from './vault'
import { createBillingMailer } from './billing-email'
import type { BillingDeps, BillingRepo, SubscriptionRow } from './billing'

const SUB_COLS = 'tenant_id, plan, billing_interval, amount_cents, currency, status, provider_subscription_id, payment_token_ref, current_period_end, past_due_since, failed_attempts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeBillingRepo(db: any): BillingRepo {
  const fail = (op: string, error: { message: string } | null) => { if (error) throw new Error(`[billing-repo] ${op}: ${error.message}`) }
  return {
    async insertEvent(e) {
      const { error } = await db.from('billing_events').insert({
        tenant_id: e.tenantId, provider: e.provider, event_key: e.eventKey, type: e.type,
        amount_cents: e.amountCents, currency: e.currency, payload: e.payload ?? {},
      })
      if (error?.code === '23505') return 'duplicate'
      fail('insertEvent', error)
      return 'inserted'
    },
    async deleteEvent(provider, eventKey) {
      const { error } = await db.from('billing_events').delete().eq('provider', provider).eq('event_key', eventKey)
      fail('deleteEvent', error)
    },
    async getSubscription(tenantId) {
      const { data, error } = await db.from('subscriptions').select(SUB_COLS).eq('tenant_id', tenantId).maybeSingle()
      fail('getSubscription', error)
      return (data as SubscriptionRow | null) ?? null
    },
    async upsertSubscription(row) {
      const { error } = await db.from('subscriptions').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' })
      fail('upsertSubscription', error)
    },
    async setTenantStatus(tenantId, status) {
      const { error } = await db.from('tenants').update({ status }).eq('id', tenantId)
      fail('setTenantStatus', error)
    },
    async getTenantContact(tenantId) {
      const { data, error } = await db.from('tenants').select('name, owner_email, plan').eq('id', tenantId).maybeSingle()
      fail('getTenantContact', error)
      return data ? { name: data.name, email: data.owner_email ?? null, plan: data.plan } : null
    },
    async getPlan(key) {
      const { data, error } = await db.from('plans').select('key, name, price_cents, currency').eq('key', key).maybeSingle()
      fail('getPlan', error)
      return data ?? null
    },
    async listPastDue() {
      const { data, error } = await db.from('subscriptions').select(SUB_COLS).eq('status', 'past_due')
      fail('listPastDue', error)
      return (data as SubscriptionRow[] | null) ?? []
    },
  }
}

/** Proveedor PayZen desde env. Lanza si no está configurado (fail-closed). */
export function getBillingProvider(): BillingProvider {
  const shopId = process.env.PAYZEN_SHOP_ID
  const password = process.env.PAYZEN_PASSWORD
  if (!shopId || !password) throw new Error('[billing] PayZen no configurado: faltan PAYZEN_SHOP_ID / PAYZEN_PASSWORD')
  return createPayzenBillingProvider({ shopId, password, baseUrl: process.env.PAYZEN_API_URL || undefined })
}

/** Política de cobranza: env opcional sobre el default (3 intentos / 7 días). */
export function dunningFromEnv(): DunningPolicy | undefined {
  const a = Number(process.env.BILLING_DUNNING_MAX_ATTEMPTS)
  const g = Number(process.env.BILLING_DUNNING_GRACE_DAYS)
  if (!(a > 0) && !(g > 0)) return undefined
  return { maxAttempts: a > 0 ? a : 3, graceDays: g > 0 ? g : 7 }
}

export function getBillingDeps(): BillingDeps {
  return {
    repo: makeBillingRepo(platformDb()),
    provider: getBillingProvider(),
    vault: getSecretsVault(),
    mailer: createBillingMailer(),
    policy: dunningFromEnv(),
    log: (m, x) => console.error(m, x),
  }
}
