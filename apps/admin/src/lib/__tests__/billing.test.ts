/**
 * @jest-environment node
 */
import { billingView, canManageBilling, startBillingCheckout, type BillingSummary } from '../billing'

type Sub = NonNullable<BillingSummary['subscription']>
const plan = { key: 'pro', name: 'Pro', priceCents: 6000000, currency: 'COP' }
const sub = (o: Partial<Sub> = {}): Sub => ({
  status: 'active', interval: 'monthly', amountCents: 6000000, currency: 'COP', currentPeriodEnd: '2026-12-10T15:00:00.000Z',
  pastDueSince: null, failedAttempts: 0, hasPaymentMethod: true, autoRenew: true, ...o,
})

describe('billingView', () => {
  it('sin suscripción → activar', () => {
    expect(billingView({ plan, subscription: null })).toMatchObject({ tone: 'neutral', cta: 'Pagar y activar' })
  })
  it('activo → al día con fecha y renovación', () => {
    const v = billingView({ plan, subscription: sub() })
    expect(v.tone).toBe('success'); expect(v.message).toMatch(/diciembre/); expect(v.message).toMatch(/automáticamente/); expect(v.cta).toBe('Cambiar tarjeta')
  })
  it('en mora → advertencia con intentos', () => {
    const v = billingView({ plan, subscription: sub({ status: 'past_due', failedAttempts: 2 }) })
    expect(v.tone).toBe('warn'); expect(v.message).toMatch(/2 intentos/); expect(v.cta).toBe('Pagar ahora')
  })
  it('suspendida → reactivar', () => {
    expect(billingView({ plan, subscription: sub({ status: 'suspended' }) })).toMatchObject({ tone: 'danger', cta: 'Pagar y reactivar' })
  })
  it('plan gratis o cancelada → sin botón de pago', () => {
    expect(billingView({ plan: { ...plan, priceCents: 0 }, subscription: null }).cta).toBeNull()
    expect(billingView({ plan, subscription: sub({ status: 'canceled' }) }).cta).toBeNull()
  })
})

describe('canManageBilling', () => {
  it('solo admin y super_admin', () => {
    expect(canManageBilling('super_admin')).toBe(true)
    expect(canManageBilling('admin')).toBe(true)
    expect(canManageBilling('vendedor')).toBe(false)
    expect(canManageBilling(undefined)).toBe(false)
  })
})

describe('startBillingCheckout', () => {
  const OLD = { ...process.env }
  const realFetch = global.fetch
  afterEach(() => { process.env = { ...OLD }; global.fetch = realFetch })

  it('sin consola configurada → error claro', async () => {
    delete process.env.CONSOLE_URL; delete process.env.CONTROL_PLANE_URL
    expect(await startBillingCheckout('t1', 'monthly')).toEqual({ ok: false, error: expect.stringMatching(/no está configurado/) })
  })
  it('traduce errores de la consola y pasa la sesión cuando hay formToken', async () => {
    process.env.CONSOLE_URL = 'https://console.test/'; process.env.INTERNAL_API_SECRET = 's'.repeat(24)
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'owner_email_missing' }) }) as unknown as typeof fetch
    expect(await startBillingCheckout('t1', 'monthly')).toEqual({ ok: false, error: expect.stringMatching(/correo del dueño/) })

    const f = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ formToken: 'ft', publicKey: 'pk', amountCents: 1, currency: 'COP' }) })
    global.fetch = f as unknown as typeof fetch
    expect(await startBillingCheckout('t1', 'yearly')).toEqual({ ok: true, session: { formToken: 'ft', publicKey: 'pk', amountCents: 1, currency: 'COP' } })
    expect(f.mock.calls[0][0]).toBe('https://console.test/api/internal/tenants/t1/billing/checkout')
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ interval: 'yearly' })
  })
})
