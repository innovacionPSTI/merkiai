import { InMemoryVault, type BillingProvider } from '@merkiai/tenancy'
import { collectFees, feeOrderId, parseFeeOrderId, previousPeriod, monthStart, settleFeeInvoiceFromWebhook, type FeeInvoice, type FeeRepo } from '../fee-collection'

const T = '11111111-2222-3333-4444-555555555555'
const NOW = new Date('2026-12-02T11:00:00.000Z')

function setup(opts: { token?: boolean; outcome?: 'succeeded' | 'failed' | 'pending'; throws?: boolean } = {}) {
  const fees = [
    { id: 1, tenant_id: T, fee_cents: 250000, created_at: '2026-11-10T00:00:00Z', invoice_id: null as number | null, status: 'accrued' },
    { id: 2, tenant_id: T, fee_cents: 100000, created_at: '2026-11-20T00:00:00Z', invoice_id: null as number | null, status: 'accrued' },
    { id: 3, tenant_id: T, fee_cents: 999, created_at: '2026-12-01T05:00:00Z', invoice_id: null as number | null, status: 'accrued' }, // mes en curso
  ]
  const invoices: FeeInvoice[] = []
  const vault = new InMemoryVault()
  let tokenRef: string | null = null
  const repo: FeeRepo = {
    async listUninvoicedFees(before) { return fees.filter((f) => f.status === 'accrued' && f.invoice_id == null && f.created_at < before) },
    async getInvoice(t, p) { return invoices.find((i) => i.tenant_id === t && i.period === p) ?? null },
    async createInvoice(t, p) { const i: FeeInvoice = { id: invoices.length + 1, tenant_id: t, period: p, amount_cents: 0, currency: 'COP', status: 'pending', attempts: 0, last_attempt_at: null }; invoices.push(i); return i },
    async attachFees(id, ids) { for (const f of fees) if (ids.includes(f.id)) { f.invoice_id = id; f.status = 'invoiced' } const total = fees.filter((f) => f.invoice_id === id).reduce((s, f) => s + f.fee_cents, 0); invoices.find((i) => i.id === id)!.amount_cents = total; return total },
    async listChargeable(max, before) { return invoices.filter((i) => ['pending', 'failed'].includes(i.status) && i.attempts < max && (!i.last_attempt_at || i.last_attempt_at < before)).map((i) => ({ ...i })) },
    async updateInvoice(id, patch) { Object.assign(invoices.find((i) => i.id === id)!, patch) },
    async markFeesCharged(id) { for (const f of fees) if (f.invoice_id === id) f.status = 'charged' },
    async getPaymentTokenRef() { return tokenRef },
  }
  const charges: unknown[] = []
  const provider = {
    id: 'payzen',
    async chargeToken(i: unknown) { charges.push(i); if (opts.throws) throw new Error('red caída'); return { outcome: opts.outcome ?? 'succeeded', transactionId: 'tx-fee' } },
  } as unknown as BillingProvider
  return {
    deps: { repo, provider, vault, now: () => NOW },
    fees, invoices, charges,
    async withToken() { tokenRef = await vault.put('t', 'tok-1') },
  }
}

describe('periodos y orderId', () => {
  it('factura el mes anterior y corta al inicio del mes', () => {
    expect(previousPeriod(NOW)).toBe('2026-11')
    expect(previousPeriod(new Date('2027-01-05T00:00:00Z'))).toBe('2026-12')
    expect(monthStart(NOW).toISOString()).toBe('2026-12-01T00:00:00.000Z')
  })
  it('orderId válido para PayZen y reversible', () => {
    const id = feeOrderId(T, '2026-11')
    expect(id).toBe(`fee-${T}-202611`); expect(id.length).toBeLessThanOrEqual(64)
    expect(parseFeeOrderId(id)).toEqual({ tenantId: T, period: '2026-11' })
    expect(parseFeeOrderId(`sub-${T}-1`)).toBeNull()
  })
})

describe('collectFees', () => {
  it('agrupa lo del mes cerrado en una cuenta y la cobra con el token del plan', async () => {
    const s = setup(); await s.withToken()
    expect(await collectFees(s.deps)).toMatchObject({ invoiced: 1, paid: 1 })
    expect(s.invoices[0]).toMatchObject({ period: '2026-11', amount_cents: 350000, status: 'paid', attempts: 1, provider_payment_id: 'tx-fee' })
    expect(s.fees.map((f) => f.status)).toEqual(['charged', 'charged', 'accrued']) // la de diciembre espera
    expect(s.charges[0]).toMatchObject({ orderId: `fee-${T}-202611`, amountCents: 350000, paymentToken: 'tok-1' })
  })
  it('idempotente: una segunda corrida no vuelve a cobrar', async () => {
    const s = setup(); await s.withToken()
    await collectFees(s.deps); await collectFees(s.deps)
    expect(s.charges).toHaveLength(1)
  })
  it('sin tarjeta: queda pendiente sin gastar intentos', async () => {
    const s = setup()
    expect(await collectFees(s.deps)).toMatchObject({ invoiced: 1, skipped: 1 })
    expect(s.invoices[0]).toMatchObject({ status: 'pending', attempts: 0 })
    expect((s.invoices[0] as unknown as { last_error: string }).last_error).toMatch(/medio de pago/)
  })
  it('rechazo o error → failed con intento; en curso → processing', async () => {
    const r = setup({ outcome: 'failed' }); await r.withToken()
    await collectFees(r.deps); expect(r.invoices[0]).toMatchObject({ status: 'failed', attempts: 1 })
    const e = setup({ throws: true }); await e.withToken()
    await collectFees(e.deps); expect(e.invoices[0]).toMatchObject({ status: 'failed', attempts: 1 })
    const p = setup({ outcome: 'pending' }); await p.withToken()
    await collectFees(p.deps); expect(p.invoices[0]).toMatchObject({ status: 'processing' })
  })
  it('respeta el máximo de intentos y el espaciado diario', async () => {
    const s = setup({ outcome: 'failed' }); await s.withToken()
    await collectFees(s.deps)
    await collectFees({ ...s.deps, now: () => new Date(NOW.getTime() + 3_600_000) }) // 1 h después: no reintenta
    expect(s.charges).toHaveLength(1)
    await collectFees({ ...s.deps, now: () => new Date(NOW.getTime() + 86_400_000) })
    await collectFees({ ...s.deps, now: () => new Date(NOW.getTime() + 2 * 86_400_000) })
    await collectFees({ ...s.deps, now: () => new Date(NOW.getTime() + 3 * 86_400_000) })
    expect(s.charges).toHaveLength(3)
  })
})

describe('settleFeeInvoiceFromWebhook', () => {
  it('cierra la cuenta en curso según la IPN', async () => {
    const s = setup({ outcome: 'pending' }); await s.withToken()
    await collectFees(s.deps)
    const hook = { eventKey: 'tx-ipn', tenantId: T, outcome: 'succeeded' as const, amountCents: 350000, currency: 'COP', paymentToken: null, orderId: `fee-${T}-202611` }
    expect(await settleFeeInvoiceFromWebhook(s.deps.repo, hook)).toBe('paid')
    expect(s.invoices[0].status).toBe('paid')
    expect(await settleFeeInvoiceFromWebhook(s.deps.repo, hook)).toBe('ignored') // repetida
    expect(await settleFeeInvoiceFromWebhook(s.deps.repo, { ...hook, orderId: 'sub-x' })).toBe('ignored')
  })
})
