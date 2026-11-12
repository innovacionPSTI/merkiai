import { createPayzenBillingProvider, payzenSignature, InMemoryVault } from '@merkiai/tenancy'
import {
  buildOrderId, tenantIdFromOrderId, effectDateOf, processBillingWebhook, startCheckout, sweepDunning, getBillingSummary,
  type BillingDeps, type BillingRepo, type SubscriptionRow,
} from '../billing'
import { renderBillingEmail } from '../billing-email'

const T = '11111111-2222-3333-4444-555555555555'
const PW = 'testpassword_x'
const NOW = new Date('2026-11-10T15:00:00.000Z')

function ipn(o: { status?: string; uuid?: string; token?: string | null; orderId?: string; meta?: boolean } = {}) {
  const answer = JSON.stringify({
    orderStatus: o.status ?? 'PAID',
    orderDetails: { orderId: o.orderId ?? `sub-${T}-1`, orderCurrency: 'COP', ...(o.meta === false ? {} : { metadata: { tenantId: T } }) },
    transactions: [{ uuid: o.uuid ?? 'tx-1', amount: 6000000, currency: 'COP', ...(o.token === null ? {} : { paymentMethodToken: o.token ?? 'tok-1' }) }],
  })
  return { 'kr-answer': answer, 'kr-hash': payzenSignature(answer, PW), 'kr-hash-algorithm': 'sha256_hmac' }
}

function setup(sub: Partial<SubscriptionRow> | null = {}, opts: { failUpsert?: boolean; subscriptionFails?: boolean } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = new Map<string, any>()
  const statuses: string[] = []
  const mails: string[] = []
  let row: SubscriptionRow | null = sub === null ? null : {
    tenant_id: T, plan: 'pro', billing_interval: 'monthly', amount_cents: 6000000, currency: 'COP', status: 'trialing',
    provider_subscription_id: null, payment_token_ref: null, current_period_end: null, past_due_since: null, failed_attempts: 0, ...sub,
  }
  const repo: BillingRepo = {
    async insertEvent(e) { const k = `${e.provider}:${e.eventKey}`; if (events.has(k)) return 'duplicate'; events.set(k, e); return 'inserted' },
    async deleteEvent(p, k) { events.delete(`${p}:${k}`) },
    async getSubscription() { return row ? { ...row } : null },
    async upsertSubscription(r) { if (opts.failUpsert) throw new Error('db down'); row = { ...(row ?? ({} as SubscriptionRow)), ...r } },
    async setTenantStatus(_t, s) { statuses.push(s) },
    async getTenantContact() { return { name: 'Tienda Uno', email: 'owner@uno.co', plan: 'pro' } },
    async getPlan(key) { return { key, name: 'Pro', price_cents: 6000000, currency: 'COP' } },
    async listPastDue() { return row?.status === 'past_due' ? [{ ...row }] : [] },
    async listEvents() { return [...events.values()].map((e) => ({ type: e.type, amount_cents: e.amountCents, currency: e.currency, created_at: '2026-11-10T15:00:00.000Z' })) },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calls: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchImpl = (async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) })
    if (opts.subscriptionFails && url.endsWith('CreateSubscription')) return { ok: true, status: 200, json: async () => ({ status: 'ERROR', answer: { errorCode: 'X' } }) }
    return { ok: true, status: 200, json: async () => ({ status: 'SUCCESS', answer: { subscriptionId: 'sub-pz-1', formToken: 'ft-1' } }) }
  }) as unknown as typeof fetch
  const vault = new InMemoryVault()
  const deps: BillingDeps = {
    repo, vault, provider: createPayzenBillingProvider({ shopId: '1', password: PW, fetchImpl }),
    mailer: { async send(_to, template) { mails.push(template) } }, now: () => NOW,
  }
  return { deps, events, statuses, mails, calls, vault, sub: () => row }
}

describe('orderId', () => {
  it('formato válido para PayZen y reversible a tenant', () => {
    const id = buildOrderId(T, NOW)
    expect(id).toBe(`sub-${T}-20261110150000`)
    expect(id.length).toBeLessThanOrEqual(64)
    expect(id).toMatch(/^[a-zA-Z0-9_-]+$/)
    expect(tenantIdFromOrderId(id)).toBe(T)
    expect(tenantIdFromOrderId('otro-123')).toBeNull()
    expect(tenantIdFromOrderId(null)).toBeNull()
  })
  it('effectDate a medianoche UTC', () => {
    expect(effectDateOf('2026-12-10T15:00:00.000Z')).toBe('2026-12-10T00:00:00+00:00')
  })
})

describe('processBillingWebhook', () => {
  it('primer pago: activa, guarda el token SOLO en el vault, crea la recurrencia y envía correo', async () => {
    const s = setup()
    const r = await processBillingWebhook(s.deps, ipn())
    expect(r).toEqual({ status: 'processed', tenantId: T, subscription: 'active' })
    const sub = s.sub()!
    expect(sub).toMatchObject({ status: 'active', current_period_end: '2026-12-10T15:00:00.000Z', provider_subscription_id: 'sub-pz-1' })
    expect(sub.payment_token_ref).toBeTruthy()
    expect(sub.payment_token_ref).not.toContain('tok-1')
    expect(await s.vault.get(sub.payment_token_ref!)).toBe('tok-1')
    expect(JSON.stringify([...s.events.values()])).not.toContain('tok-1')
    expect(s.statuses).toEqual(['active'])
    expect(s.mails).toEqual(['activated'])
    expect(s.calls[0].body).toMatchObject({ paymentMethodToken: 'tok-1', effectDate: '2026-12-10T00:00:00+00:00' })
  })
  it('IPN reenviada → duplicate, sin efectos dobles', async () => {
    const s = setup()
    await processBillingWebhook(s.deps, ipn())
    expect(await processBillingWebhook(s.deps, ipn())).toEqual({ status: 'duplicate' })
    expect(s.mails).toEqual(['activated'])
    expect(s.sub()!.current_period_end).toBe('2026-12-10T15:00:00.000Z')
  })
  it('firma inválida → lanza y no registra nada', async () => {
    const s = setup()
    await expect(processBillingWebhook(s.deps, { ...ipn(), 'kr-hash': 'bad' })).rejects.toThrow(/firma/)
    expect(s.events.size).toBe(0)
  })
  it('rechazos: past_due → (3er intento) suspended; luego un pago reactiva', async () => {
    const s = setup({ status: 'active', current_period_end: '2026-11-10T00:00:00.000Z', provider_subscription_id: 'x' })
    for (const u of ['f1', 'f2', 'f3']) await processBillingWebhook(s.deps, ipn({ status: 'UNPAID', uuid: u, token: null }))
    expect(s.sub()).toMatchObject({ status: 'suspended', failed_attempts: 3 })
    expect(s.statuses).toEqual(['past_due', 'suspended'])
    expect(s.mails).toEqual(['payment_failed', 'payment_failed', 'suspended'])
    await processBillingWebhook(s.deps, ipn({ uuid: 'ok', token: null }))
    expect(s.sub()).toMatchObject({ status: 'active', failed_attempts: 0, past_due_since: null })
    expect(s.mails.at(-1)).toBe('reactivated')
  })
  it('recurrente sin metadata → resuelve el tenant por orderId', async () => {
    const s = setup({ status: 'active', provider_subscription_id: 'x' })
    expect((await processBillingWebhook(s.deps, ipn({ meta: false, token: null }))).status).toBe('processed')
  })
  it('pendiente / tenant desconocido / sin suscripción', async () => {
    expect(await processBillingWebhook(setup().deps, ipn({ status: 'RUNNING' }))).toEqual({ status: 'pending' })
    expect(await processBillingWebhook(setup().deps, ipn({ meta: false, orderId: 'x-1' }))).toEqual({ status: 'unknown_tenant' })
    expect(await processBillingWebhook(setup(null).deps, ipn())).toEqual({ status: 'no_subscription' })
  })
  it('fallo de persistencia → lanza y libera la idempotencia (el reintento procesa)', async () => {
    const s = setup({}, { failUpsert: true })
    await expect(processBillingWebhook(s.deps, ipn())).rejects.toThrow(/db down/)
    expect(s.events.size).toBe(0)
  })
  it('fallo al crear la recurrencia NO tumba el pago: queda activo y registrado', async () => {
    const s = setup({}, { subscriptionFails: true })
    expect((await processBillingWebhook(s.deps, ipn())).status).toBe('processed')
    expect(s.sub()).toMatchObject({ status: 'active', provider_subscription_id: null })
    expect([...s.events.values()].map((e) => e.type)).toContain('recurrence_setup_failed')
  })
})

describe('startCheckout', () => {
  it('crea la suscripción trialing con el precio del plan y devuelve formToken', async () => {
    const s = setup(null)
    const out = await startCheckout(s.deps, { tenantId: T, interval: 'yearly' })
    expect(out).toMatchObject({ formToken: 'ft-1', amountCents: 72000000, currency: 'COP' })
    expect(s.sub()).toMatchObject({ status: 'trialing', billing_interval: 'yearly', amount_cents: 72000000 })
    expect(s.calls[0].body).toMatchObject({ formAction: 'REGISTER_PAY', customer: { email: 'owner@uno.co' } })
  })
  it('no degrada el estado de una suscripción existente', async () => {
    const s = setup({ status: 'suspended' })
    await startCheckout(s.deps, { tenantId: T })
    expect(s.sub()!.status).toBe('suspended')
  })
})

describe('sweepDunning', () => {
  it('suspende solo cuando la gracia venció', async () => {
    const fresh = setup({ status: 'past_due', failed_attempts: 1, past_due_since: '2026-11-08T00:00:00.000Z' })
    expect(await sweepDunning(fresh.deps)).toEqual({ suspended: [] })
    const old = setup({ status: 'past_due', failed_attempts: 1, past_due_since: '2026-11-01T00:00:00.000Z' })
    expect(await sweepDunning(old.deps)).toEqual({ suspended: [T] })
    expect(old.sub()!.status).toBe('suspended')
    expect(old.statuses).toEqual(['suspended'])
    expect(old.mails).toEqual(['suspended'])
  })
})

describe('renderBillingEmail', () => {
  it('incluye monto y fecha, y escapa el nombre', () => {
    const { subject, html } = renderBillingEmail('receipt', { tenantName: '<b>X</b>', amountCents: 6000000, currency: 'COP', periodEnd: '2026-12-10T15:00:00.000Z' })
    expect(subject).toMatch(/Recibo/)
    expect(html).toContain('60.000')
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;')
    expect(html).toContain('diciembre')
  })
})

describe('getBillingSummary', () => {
  it('resume plan, suscripción y eventos SIN exponer token ni referencia', async () => {
    const s = setup()
    await processBillingWebhook(s.deps, ipn())
    const sum = await getBillingSummary(s.deps.repo, T)
    expect(sum?.plan).toMatchObject({ key: 'pro', priceCents: 6000000 })
    expect(sum?.subscription).toMatchObject({ status: 'active', hasPaymentMethod: true, autoRenew: true })
    expect(sum?.events[0].label).toBe('Pago aprobado')
    const json = JSON.stringify(sum)
    expect(json).not.toContain('tok-1')
    expect(json).not.toContain(s.sub()!.payment_token_ref!)
  })
})

describe('IPN de cobro de comisiones', () => {
  it('orderId fee-… no renueva el plan ni registra evento de suscripción', async () => {
    const s = setup({ status: 'active', provider_subscription_id: 'x', current_period_end: '2026-12-10T15:00:00.000Z' })
    const r = await processBillingWebhook(s.deps, ipn({ orderId: `fee-${T}-202611`, token: null }))
    expect(r.status).toBe('fee_payment')
    expect(s.sub()!.current_period_end).toBe('2026-12-10T15:00:00.000Z')
    expect(s.events.size).toBe(0)
    expect(s.mails).toEqual([])
  })
})
