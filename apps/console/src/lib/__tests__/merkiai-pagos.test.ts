import { computeMarkupFee, effectiveFeeTerms, parseAccountForm, parsePlanFeeForm, recordPaymentFee, environmentFromPassword } from '../merkiai-pagos'

const fd = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null })

describe('tarifa', () => {
  it('% + fijo, en centavos y redondeado', () => {
    expect(computeMarkupFee(10_000_000, { pct: 2.9, fixedCents: 90_000 })).toBe(290_000 + 90_000) // $100.000 → $2.900 + $900
    expect(computeMarkupFee(12_345, { pct: 1.5, fixedCents: 0 })).toBe(185)
    expect(computeMarkupFee(0, { pct: 3, fixedCents: 500 })).toBe(0)
  })
  it('override del tenant gana campo a campo', () => {
    expect(effectiveFeeTerms({ fee_pct: '2.9', fee_fixed_cents: 90000 }, null)).toEqual({ pct: 2.9, fixedCents: 90000 })
    expect(effectiveFeeTerms({ fee_pct: 2.9, fee_fixed_cents: 90000 }, { fee_pct_override: 1.9, fee_fixed_cents_override: null })).toEqual({ pct: 1.9, fixedCents: 90000 })
    expect(effectiveFeeTerms(null, null)).toEqual({ pct: 0, fixedCents: 0 })
  })
})

describe('formularios', () => {
  it('plan: acepta coma decimal y pesos con puntos', () => {
    expect(parsePlanFeeForm(fd({ plan: 'pro', fee_pct: '2,9', fee_fixed: '1.500' }))).toEqual({ ok: true, value: { plan: 'pro', fee_pct: 2.9, fee_fixed_cents: 150000 } })
    expect(parsePlanFeeForm(fd({ plan: 'pro', fee_pct: '120' })).ok).toBe(false)
  })
  it('cuenta: valida id, contraseña y activación', () => {
    const base = { tenant_id: 't1', shop_id: '33970753', status: 'pending' }
    expect(parseAccountForm(fd(base), { hasPassword: false })).toMatchObject({ ok: true, value: { fee_pct_override: null, fee_fixed_cents_override: null } })
    expect(parseAccountForm(fd({ ...base, shop_id: 'abc' }), { hasPassword: false }).ok).toBe(false)
    expect(parseAccountForm(fd({ ...base, password: 'secreto' }), { hasPassword: false }).ok).toBe(false)
    expect(parseAccountForm(fd({ ...base, status: 'active' }), { hasPassword: false })).toMatchObject({ ok: false, error: expect.stringMatching(/contraseña/) })
    expect(parseAccountForm(fd({ ...base, status: 'active' }), { hasPassword: true }).ok).toBe(true)
    expect(parseAccountForm(fd({ ...base, fee_pct_override: '1,5', fee_fixed_override: '800' }), { hasPassword: false })).toMatchObject({ value: { fee_pct_override: 1.5, fee_fixed_cents_override: 80000 } })
  })
  it('entorno por prefijo', () => {
    expect(environmentFromPassword('prodpassword_x')).toBe('production')
    expect(environmentFromPassword('testpassword_x')).toBe('test')
  })
})

describe('recordPaymentFee', () => {
  function fakeDb(account: object | null, opts: { dup?: boolean } = {}) {
    const inserted: object[] = []
    const q = (table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.eq = () => chain
      chain.maybeSingle = async () => ({
        data: table === 'merkiai_payment_accounts' ? account : table === 'tenants' ? { plan: 'pro' } : table === 'payment_fee_terms' ? { fee_pct: 2, fee_fixed_cents: 50000 } : null,
        error: null,
      })
      chain.insert = async (row: object) => { inserted.push(row); return { error: opts.dup ? { code: '23505', message: 'dup' } : null } }
      return chain
    }
    return { db: { from: q }, inserted }
  }
  const input = { tenantId: 't1', paymentId: 'tx-1', orderNumber: 'ORD-1', amountCents: 10_000_000, currency: 'COP' }
  const active = { tenant_id: 't1', provider: 'payzen', status: 'active', fee_pct_override: null, fee_fixed_cents_override: null }

  it('registra la comisión con la tarifa del plan', async () => {
    const { db, inserted } = fakeDb(active)
    expect(await recordPaymentFee(db, input)).toEqual({ status: 'recorded', feeCents: 250000 })
    expect(inserted[0]).toMatchObject({ payment_id: 'tx-1', fee_pct: 2, fee_fixed_cents: 50000, fee_cents: 250000 })
  })
  it('duplicado → idempotente; sin cuenta activa → no causa', async () => {
    expect((await recordPaymentFee(fakeDb(active, { dup: true }).db, input)).status).toBe('duplicate')
    expect(await recordPaymentFee(fakeDb({ ...active, status: 'pending' }).db, input)).toEqual({ status: 'no_account', feeCents: 0 })
  })
})
