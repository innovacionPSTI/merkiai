import { applyBillingEvent, nextPeriodEnd, shouldSuspend, type SubscriptionState } from '../billing'
import { createPayzenBillingProvider, payzenRrule, payzenSignature, verifyPayzenIpn, normalizePayzenAnswer } from '../billing-payzen'

const st = (o: Partial<SubscriptionState> = {}): SubscriptionState => ({
  status: 'active', interval: 'monthly', currentPeriodEnd: '2026-12-01T00:00:00.000Z', pastDueSince: null, failedAttempts: 0, ...o,
})
const kinds = (t: { effects: { kind: string; [k: string]: unknown }[] }) => t.effects.map((e) => (e.kind === 'email' ? `email:${e.template}` : `status:${e.status}`))

describe('nextPeriodEnd', () => {
  it('mensual y anual', () => {
    expect(nextPeriodEnd('2026-11-10T00:00:00.000Z', 'monthly')).toBe('2026-12-10T00:00:00.000Z')
    expect(nextPeriodEnd('2026-11-10T00:00:00.000Z', 'yearly')).toBe('2027-11-10T00:00:00.000Z')
  })
})

describe('applyBillingEvent', () => {
  it('primer pago: trialing → active + correo de activación', () => {
    const t = applyBillingEvent(st({ status: 'trialing', currentPeriodEnd: null }), { type: 'payment_succeeded', at: '2026-11-10T00:00:00.000Z' })
    expect(t.state.status).toBe('active'); expect(t.state.currentPeriodEnd).toBe('2026-12-10T00:00:00.000Z')
    expect(kinds(t)).toEqual(['status:active', 'email:activated'])
  })
  it('renovación: extiende desde el fin de período vigente y envía recibo (sin tocar estado)', () => {
    const t = applyBillingEvent(st(), { type: 'payment_succeeded', at: '2026-11-28T00:00:00.000Z' })
    expect(t.state.currentPeriodEnd).toBe('2027-01-01T00:00:00.000Z'); expect(kinds(t)).toEqual(['email:receipt'])
  })
  it('fallo: active → past_due + aviso; cuenta el intento', () => {
    const t = applyBillingEvent(st(), { type: 'payment_failed', at: '2026-12-01T00:00:00.000Z' })
    expect(t.state).toMatchObject({ status: 'past_due', failedAttempts: 1, pastDueSince: '2026-12-01T00:00:00.000Z' })
    expect(kinds(t)).toEqual(['status:past_due', 'email:payment_failed'])
  })
  it('agota intentos → suspended', () => {
    const t = applyBillingEvent(st({ status: 'past_due', failedAttempts: 2, pastDueSince: '2026-12-01T00:00:00.000Z' }), { type: 'payment_failed', at: '2026-12-03T00:00:00.000Z' })
    expect(t.state.status).toBe('suspended'); expect(kinds(t)).toEqual(['status:suspended', 'email:suspended'])
  })
  it('vence la gracia → suspended aunque queden intentos', () => {
    const t = applyBillingEvent(st({ status: 'past_due', failedAttempts: 1, pastDueSince: '2026-12-01T00:00:00.000Z' }), { type: 'payment_failed', at: '2026-12-09T00:00:00.000Z' }, { maxAttempts: 10, graceDays: 7 })
    expect(t.state.status).toBe('suspended')
  })
  it('pago tras suspensión → reactiva y limpia la mora', () => {
    const t = applyBillingEvent(st({ status: 'suspended', failedAttempts: 3, pastDueSince: '2026-12-01T00:00:00.000Z' }), { type: 'payment_succeeded', at: '2026-12-15T00:00:00.000Z' })
    expect(t.state).toMatchObject({ status: 'active', failedAttempts: 0, pastDueSince: null })
    expect(kinds(t)).toEqual(['status:active', 'email:reactivated'])
  })
  it('cancelada no revive con un pago tardío', () => {
    const t = applyBillingEvent(st({ status: 'canceled' }), { type: 'payment_succeeded', at: '2026-12-15T00:00:00.000Z' })
    expect(t.state.status).toBe('canceled'); expect(t.effects).toEqual([])
  })
  it('shouldSuspend respeta política configurable', () => {
    expect(shouldSuspend(st({ failedAttempts: 1, pastDueSince: '2026-12-01T00:00:00.000Z' }), '2026-12-02T00:00:00.000Z', { maxAttempts: 1, graceDays: 30 })).toBe(true)
  })
})

describe('PayZen · IPN', () => {
  const password = 'testpassword_abc'
  const answer = JSON.stringify({
    orderStatus: 'PAID', orderDetails: { orderId: 'sub-t1-1', orderCurrency: 'COP', metadata: { tenantId: 't-1' } },
    transactions: [{ uuid: 'tx-123', amount: 6000000, currency: 'COP', paymentMethodToken: 'tok-9' }],
  })
  const fields = { 'kr-answer': answer, 'kr-hash': payzenSignature(answer, password), 'kr-hash-algorithm': 'sha256_hmac' }

  it('acepta firma válida y rechaza manipulada / otra clave', () => {
    expect(verifyPayzenIpn(fields, password)).toBe(true)
    expect(verifyPayzenIpn({ ...fields, 'kr-answer': answer.replace('6000000', '1') }, password)).toBe(false)
    expect(verifyPayzenIpn(fields, 'otra')).toBe(false)
    expect(verifyPayzenIpn({ 'kr-answer': answer }, password)).toBe(false)
  })
  it('parseWebhook normaliza y lanza con firma inválida', () => {
    const p = createPayzenBillingProvider({ shopId: '1', password })
    expect(p.parseWebhook(fields)).toEqual({ eventKey: 'tx-123', tenantId: 't-1', outcome: 'succeeded', amountCents: 6000000, currency: 'COP', paymentToken: 'tok-9', orderId: 'sub-t1-1' })
    expect(() => p.parseWebhook({ ...fields, 'kr-hash': 'deadbeef' })).toThrow(/firma/)
  })
  it('estados: UNPAID → failed, RUNNING → pending; sin uuid lanza', () => {
    expect(normalizePayzenAnswer({ orderStatus: 'UNPAID', transactions: [{ uuid: 'a' }] }).outcome).toBe('failed')
    expect(normalizePayzenAnswer({ orderStatus: 'RUNNING', transactions: [{ uuid: 'a' }] }).outcome).toBe('pending')
    expect(() => normalizePayzenAnswer({ orderStatus: 'PAID', transactions: [] })).toThrow(/uuid/)
  })
})

describe('PayZen · llamadas REST (fetch inyectado)', () => {
  const mk = (answer: unknown, status = 'SUCCESS') => {
    const calls: { url: string; init: any }[] = []
    const fetchImpl = (async (url: string, init: any) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => ({ status, answer }) } }) as unknown as typeof fetch
    return { calls, p: createPayzenBillingProvider({ shopId: '123', password: 'pw', fetchImpl }) }
  }
  it('createRegisterAndPay: REGISTER_PAY + Basic auth + metadata.tenantId', async () => {
    const { calls, p } = mk({ formToken: 'ft-1' })
    expect(await p.createRegisterAndPay({ tenantId: 't-1', orderId: 'o1', amountCents: 100, currency: 'COP', email: 'a@b.co' })).toEqual({ formToken: 'ft-1' })
    expect(calls[0].url).toBe('https://api.payzen.lat/api-payment/V4/Charge/CreatePayment')
    expect(calls[0].init.headers.authorization).toBe('Basic ' + Buffer.from('123:pw').toString('base64'))
    expect(JSON.parse(calls[0].init.body)).toMatchObject({ formAction: 'REGISTER_PAY', metadata: { tenantId: 't-1' } })
  })
  it('createSubscription envía token + rrule', async () => {
    const { calls, p } = mk({ subscriptionId: 's-1' })
    await p.createSubscription({ tenantId: 't-1', orderId: 'o', amountCents: 100, currency: 'COP', paymentToken: 'tok', interval: 'monthly', effectDate: '2026-11-30T00:00:00+00:00' })
    expect(JSON.parse(calls[0].init.body)).toMatchObject({ paymentMethodToken: 'tok', rrule: 'RRULE:FREQ=MONTHLY;BYMONTHDAY=28;INTERVAL=1' })
  })
  it('error del proveedor → lanza con el código', async () => {
    const { p } = mk({ errorCode: 'INT_905', errorMessage: 'bad' }, 'ERROR')
    await expect(p.chargeToken({ tenantId: 't', orderId: 'o', amountCents: 1, currency: 'COP', paymentToken: 'x' })).rejects.toThrow(/INT_905/)
  })
  it('rrule anual', () => { expect(payzenRrule('yearly', '2026-11-10T00:00:00Z')).toBe('RRULE:FREQ=YEARLY;INTERVAL=1') })
})
