/**
 * "Merkiai Pagos" (HU-441 · ADR-009 Modelo B). Tienda PayZen gestionada por
 * Merkiai para cada tenant; el dinero va DIRECTO a la cuenta del tenant y
 * Merkiai causa una comisión por venta (markup) parametrizable por plan y por
 * tenant. Este módulo: lógica pura (tarifa, formularios) + acceso a datos
 * inyectado (BD de plataforma). Los secretos solo viajan como ref del vault.
 */

// ─── Tarifa (pura) ────────────────────────────────────────────────────────────

export interface FeeTerms { pct: number; fixedCents: number }

/** Comisión de una venta: round(monto × % / 100) + fijo. Todo en centavos. PURO. */
export function computeMarkupFee(amountCents: number, terms: FeeTerms): number {
  if (!(amountCents > 0)) return 0
  return Math.round((amountCents * terms.pct) / 100) + Math.max(0, Math.round(terms.fixedCents))
}

/** Tarifa efectiva: el override del tenant gana campo a campo sobre la del plan. PURO. */
export function effectiveFeeTerms(
  plan: { fee_pct: number | string; fee_fixed_cents: number } | null,
  account: { fee_pct_override: number | string | null; fee_fixed_cents_override: number | null } | null,
): FeeTerms {
  const pct = account?.fee_pct_override ?? plan?.fee_pct ?? 0
  const fixed = account?.fee_fixed_cents_override ?? plan?.fee_fixed_cents ?? 0
  return { pct: Number(pct), fixedCents: Number(fixed) }
}

/** "2,9" / "2.9" / "" → número o null (vacío). Lanza mensaje claro si es inválido. */
function parsePct(raw: string, allowEmpty: boolean): number | null {
  const v = raw.trim().replace(',', '.')
  if (v === '') { if (allowEmpty) return null; return 0 }
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n >= 100) throw new Error('El porcentaje debe ser un número entre 0 y 99,99.')
  return Math.round(n * 1000) / 1000
}
/** Pesos (sin decimales, admite "1.500" o "1500") → centavos, o null si vacío. */
function parsePesosToCents(raw: string, allowEmpty: boolean): number | null {
  const v = raw.trim().replace(/[.\s$]/g, '').replace(',', '.')
  if (v === '') { if (allowEmpty) return null; return 0 }
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) throw new Error('El valor fijo debe ser un número de pesos ≥ 0.')
  return Math.round(n * 100)
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

/** Formulario de tarifa por plan. PURO. */
export function parsePlanFeeForm(fd: { get(k: string): unknown }): ParseResult<{ plan: string; fee_pct: number; fee_fixed_cents: number }> {
  const plan = String(fd.get('plan') ?? '').trim()
  if (!plan) return { ok: false, error: 'Falta el plan.' }
  try {
    return { ok: true, value: { plan, fee_pct: parsePct(String(fd.get('fee_pct') ?? ''), false)!, fee_fixed_cents: parsePesosToCents(String(fd.get('fee_fixed') ?? ''), false)! } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface AccountFormValue {
  tenant_id: string
  shop_id: string
  status: 'pending' | 'active' | 'disabled'
  fee_pct_override: number | null
  fee_fixed_cents_override: number | null
  /** Contraseña nueva (write-only); '' = sin cambios. */
  password: string
}

/** Formulario de cuenta Merkiai Pagos de un tenant. PURO. */
export function parseAccountForm(fd: { get(k: string): unknown }, opts: { hasPassword: boolean }): ParseResult<AccountFormValue> {
  const tenant_id = String(fd.get('tenant_id') ?? '').trim()
  const shop_id = String(fd.get('shop_id') ?? '').trim()
  const status = String(fd.get('status') ?? 'pending') as AccountFormValue['status']
  const password = String(fd.get('password') ?? '').trim()
  if (!tenant_id) return { ok: false, error: 'Elige la tienda.' }
  if (!/^\d{4,20}$/.test(shop_id)) return { ok: false, error: 'El identificador de tienda PayZen son solo números (4 a 20 dígitos).' }
  if (!['pending', 'active', 'disabled'].includes(status)) return { ok: false, error: 'Estado inválido.' }
  if (password && !/^(test|prod)password_/.test(password)) return { ok: false, error: 'La contraseña REST de PayZen empieza por testpassword_ o prodpassword_.' }
  if (status === 'active' && !password && !opts.hasPassword) return { ok: false, error: 'Para activar la cuenta carga la contraseña REST.' }
  try {
    return {
      ok: true,
      value: {
        tenant_id, shop_id, status, password,
        fee_pct_override: parsePct(String(fd.get('fee_pct_override') ?? ''), true),
        fee_fixed_cents_override: parsePesosToCents(String(fd.get('fee_fixed_override') ?? ''), true),
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function environmentFromPassword(password: string): 'test' | 'production' {
  return password.startsWith('prodpassword_') ? 'production' : 'test'
}

// ─── Datos (BD de plataforma inyectada) ───────────────────────────────────────

export interface AccountRow {
  tenant_id: string
  provider: string
  status: 'pending' | 'active' | 'disabled'
  shop_id: string | null
  password_ref: string | null
  environment: 'test' | 'production'
  fee_pct_override: number | string | null
  fee_fixed_cents_override: number | null
}

const ACCOUNT_COLS = 'tenant_id, provider, status, shop_id, password_ref, environment, fee_pct_override, fee_fixed_cents_override'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any

function fail(op: string, error: { message: string } | null) {
  if (error) throw new Error(`[merkiai-pagos] ${op}: ${error.message}`)
}

export async function getAccount(db: Db, tenantId: string): Promise<AccountRow | null> {
  const { data, error } = await db.from('merkiai_payment_accounts').select(ACCOUNT_COLS).eq('tenant_id', tenantId).maybeSingle()
  fail('getAccount', error)
  return data ?? null
}

export async function upsertAccount(db: Db, row: Partial<AccountRow> & { tenant_id: string }): Promise<void> {
  const { error } = await db.from('merkiai_payment_accounts').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' })
  fail('upsertAccount', error)
}

export async function getPlanFeeTerms(db: Db, plan: string): Promise<{ fee_pct: number | string; fee_fixed_cents: number } | null> {
  const { data, error } = await db.from('payment_fee_terms').select('fee_pct, fee_fixed_cents').eq('plan', plan).maybeSingle()
  fail('getPlanFeeTerms', error)
  return data ?? null
}

export async function listPlanFeeTerms(db: Db): Promise<Record<string, FeeTerms>> {
  const { data, error } = await db.from('payment_fee_terms').select('plan, fee_pct, fee_fixed_cents')
  fail('listPlanFeeTerms', error)
  return Object.fromEntries((data ?? []).map((r: any) => [r.plan, { pct: Number(r.fee_pct), fixedCents: r.fee_fixed_cents }]))
}

export async function upsertPlanFeeTerms(db: Db, v: { plan: string; fee_pct: number; fee_fixed_cents: number }): Promise<void> {
  const { error } = await db.from('payment_fee_terms').upsert({ ...v, updated_at: new Date().toISOString() }, { onConflict: 'plan' })
  fail('upsertPlanFeeTerms', error)
}

/**
 * Causa la comisión de una venta aprobada. Idempotente por (tenant, payment_id):
 * reintentos de la IPN no duplican. Devuelve la comisión registrada.
 */
export async function recordPaymentFee(
  db: Db,
  input: { tenantId: string; paymentId: string; orderNumber: string; amountCents: number; currency: string },
): Promise<{ status: 'recorded' | 'duplicate' | 'no_account'; feeCents: number }> {
  const account = await getAccount(db, input.tenantId)
  if (!account || account.status !== 'active') return { status: 'no_account', feeCents: 0 }
  const { data: tenant, error: te } = await db.from('tenants').select('plan').eq('id', input.tenantId).maybeSingle()
  fail('tenant', te)
  const terms = effectiveFeeTerms(tenant?.plan ? await getPlanFeeTerms(db, tenant.plan) : null, account)
  const feeCents = computeMarkupFee(input.amountCents, terms)
  const { error } = await db.from('payment_fees').insert({
    tenant_id: input.tenantId, provider: account.provider, payment_id: input.paymentId, order_number: input.orderNumber,
    amount_cents: input.amountCents, currency: input.currency, fee_pct: terms.pct, fee_fixed_cents: terms.fixedCents, fee_cents: feeCents,
  })
  if (error?.code === '23505') return { status: 'duplicate', feeCents }
  fail('recordPaymentFee', error)
  return { status: 'recorded', feeCents }
}

export interface AccountOverview {
  tenantId: string
  tenantName: string
  plan: string
  status: AccountRow['status']
  environment: AccountRow['environment']
  shopId: string | null
  hasPassword: boolean
  feePctOverride: number | null
  feeFixedCentsOverride: number | null
  terms: FeeTerms
  month: { sales: number; amountCents: number; feeCents: number }
}

/** Cuentas + tarifa efectiva + comisiones del mes en curso. Sin secretos. */
export async function listAccountsOverview(db: Db, now = new Date()): Promise<AccountOverview[]> {
  const { data: accounts, error } = await db.from('merkiai_payment_accounts').select(`${ACCOUNT_COLS}, tenants(name, plan)`)
  fail('listAccounts', error)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const { data: fees, error: fe } = await db.from('payment_fees').select('tenant_id, amount_cents, fee_cents').gte('created_at', monthStart).neq('status', 'void')
  fail('listFees', fe)
  const planTerms = await listPlanFeeTerms(db)
  return (accounts ?? []).map((a: any) => {
    const t = Array.isArray(a.tenants) ? a.tenants[0] : a.tenants
    const mine = (fees ?? []).filter((f: any) => f.tenant_id === a.tenant_id)
    const plan = planTerms[t?.plan]
    return {
      tenantId: a.tenant_id,
      tenantName: t?.name ?? a.tenant_id,
      plan: t?.plan ?? '—',
      status: a.status,
      environment: a.environment,
      shopId: a.shop_id,
      hasPassword: Boolean(a.password_ref),
      feePctOverride: a.fee_pct_override == null ? null : Number(a.fee_pct_override),
      feeFixedCentsOverride: a.fee_fixed_cents_override,
      terms: effectiveFeeTerms(plan ? { fee_pct: plan.pct, fee_fixed_cents: plan.fixedCents } : null, a),
      month: {
        sales: mine.length,
        amountCents: mine.reduce((s: number, f: any) => s + f.amount_cents, 0),
        feeCents: mine.reduce((s: number, f: any) => s + f.fee_cents, 0),
      },
    }
  })
}
/* eslint-enable @typescript-eslint/no-explicit-any */
