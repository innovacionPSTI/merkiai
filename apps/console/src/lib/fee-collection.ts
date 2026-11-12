/**
 * Cobro mensual de comisiones de "Merkiai Pagos" (HU-441). Corre en el cron
 * diario del console; es idempotente, así que repetirlo no cobra dos veces.
 *
 *  1. Facturar: comisiones `accrued` anteriores al mes en curso → una cuenta de
 *     cobro por (tenant, periodo = mes anterior).
 *  2. Cobrar: cuentas `pending`/`failed` con intentos disponibles → cobro con el
 *     token del plan (vault) vía `BillingProvider.chargeToken` (SILENT).
 *     Aprobado → `paid` (+ comisiones `charged`); en curso → `processing` (lo
 *     cierra la IPN); rechazado → `failed` e intento++.
 *  3. IPN: `settleFeeInvoiceFromWebhook` cierra las que quedaron `processing`.
 *
 * Todo inyectado (repo/proveedor/vault) → testeable sin red.
 */
import type { BillingProvider, NormalizedBillingWebhook, SecretsVault } from '@merkiai/tenancy'

export type FeeInvoiceStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'waived'

export interface FeeInvoice {
  id: number
  tenant_id: string
  period: string
  amount_cents: number
  currency: string
  status: FeeInvoiceStatus
  attempts: number
  last_attempt_at: string | null
}

export interface FeeRepo {
  /** Comisiones `accrued` sin cuenta de cobro, creadas antes de `before`. */
  listUninvoicedFees(before: string): Promise<{ id: number; tenant_id: string; fee_cents: number }[]>
  getInvoice(tenantId: string, period: string): Promise<FeeInvoice | null>
  createInvoice(tenantId: string, period: string): Promise<FeeInvoice>
  /** Enlaza comisiones y deja `amount_cents` = suma de todas las enlazadas. */
  attachFees(invoiceId: number, feeIds: number[]): Promise<number>
  listChargeable(maxAttempts: number, retryBefore: string): Promise<FeeInvoice[]>
  updateInvoice(id: number, patch: Partial<Omit<FeeInvoice, 'id'>> & { last_error?: string | null; provider_payment_id?: string | null }): Promise<void>
  /** Marca como `charged` las comisiones de la cuenta. */
  markFeesCharged(invoiceId: number): Promise<void>
  /** Referencia en el vault del medio de pago del plan del tenant (o null). */
  getPaymentTokenRef(tenantId: string): Promise<string | null>
}

export interface FeeDeps {
  repo: FeeRepo
  provider: BillingProvider
  vault: SecretsVault
  now?: () => Date
  maxAttempts?: number
  log?: (msg: string, extra?: unknown) => void
}

// ─── Puros ────────────────────────────────────────────────────────────────────

/** Primer instante (UTC) del mes de `d`. */
export function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}
/** Periodo `YYYY-MM` del mes ANTERIOR a `d` (el que se factura). */
export function previousPeriod(d: Date): string {
  const p = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1))
  return `${p.getUTCFullYear()}-${String(p.getUTCMonth() + 1).padStart(2, '0')}`
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** `fee-<tenantId>-<YYYYMM>` (≤ 64 y solo [a-zA-Z0-9_-], límite PayZen). */
export function feeOrderId(tenantId: string, period: string): string {
  return `fee-${tenantId}-${period.replace('-', '')}`
}
export function parseFeeOrderId(orderId: string | null | undefined): { tenantId: string; period: string } | null {
  const m = orderId?.match(new RegExp(`^fee-(${UUID})-(\\d{4})(\\d{2})$`, 'i'))
  return m ? { tenantId: m[1].toLowerCase(), period: `${m[2]}-${m[3]}` } : null
}
export function isFeeOrderId(orderId: string | null | undefined): boolean {
  return Boolean(orderId?.startsWith('fee-'))
}

// ─── Orquestación ─────────────────────────────────────────────────────────────

export interface CollectResult { invoiced: number; paid: number; processing: number; failed: number; skipped: number }

export async function collectFees(deps: FeeDeps): Promise<CollectResult> {
  const now = deps.now?.() ?? new Date()
  const maxAttempts = deps.maxAttempts ?? 3
  const out: CollectResult = { invoiced: 0, paid: 0, processing: 0, failed: 0, skipped: 0 }

  // 1) Facturar lo causado hasta el cierre del mes anterior.
  const period = previousPeriod(now)
  const fees = await deps.repo.listUninvoicedFees(monthStart(now).toISOString())
  const byTenant = new Map<string, number[]>()
  for (const f of fees) byTenant.set(f.tenant_id, [...(byTenant.get(f.tenant_id) ?? []), f.id])
  for (const [tenantId, ids] of byTenant) {
    let inv = await deps.repo.getInvoice(tenantId, period)
    if (inv && (inv.status === 'paid' || inv.status === 'processing' || inv.status === 'waived')) {
      deps.log?.(`[fees] ${tenantId} ${period}: cuenta ya ${inv.status}; ${ids.length} comisiones quedan para revisión`)
      continue
    }
    if (!inv) inv = await deps.repo.createInvoice(tenantId, period)
    await deps.repo.attachFees(inv.id, ids)
    out.invoiced++
  }

  // 2) Cobrar (máximo un intento por cuenta cada ~20 h).
  const retryBefore = new Date(now.getTime() - 20 * 3_600_000).toISOString()
  for (const inv of await deps.repo.listChargeable(maxAttempts, retryBefore)) {
    const at = now.toISOString()
    if (inv.amount_cents <= 0) {
      await deps.repo.updateInvoice(inv.id, { status: 'waived', last_attempt_at: at })
      out.skipped++
      continue
    }
    const ref = await deps.repo.getPaymentTokenRef(inv.tenant_id)
    if (!ref) {
      // Sin tarjeta registrada: no gasta intentos; queda visible para gestión manual.
      await deps.repo.updateInvoice(inv.id, { last_attempt_at: at, last_error: 'La tienda no tiene medio de pago registrado.' })
      out.skipped++
      continue
    }
    try {
      const token = await deps.vault.get(ref)
      const r = await deps.provider.chargeToken({
        tenantId: inv.tenant_id, orderId: feeOrderId(inv.tenant_id, inv.period), amountCents: inv.amount_cents, currency: inv.currency, paymentToken: token,
      })
      if (r.outcome === 'succeeded') {
        await deps.repo.updateInvoice(inv.id, { status: 'paid', last_attempt_at: at, last_error: null, provider_payment_id: r.transactionId, attempts: inv.attempts + 1 })
        await deps.repo.markFeesCharged(inv.id)
        out.paid++
      } else if (r.outcome === 'pending') {
        await deps.repo.updateInvoice(inv.id, { status: 'processing', last_attempt_at: at, provider_payment_id: r.transactionId, attempts: inv.attempts + 1 })
        out.processing++
      } else {
        await deps.repo.updateInvoice(inv.id, { status: 'failed', last_attempt_at: at, last_error: 'Cobro rechazado', attempts: inv.attempts + 1 })
        out.failed++
      }
    } catch (err) {
      await deps.repo.updateInvoice(inv.id, { status: 'failed', last_attempt_at: at, last_error: String((err as Error)?.message ?? err).slice(0, 300), attempts: inv.attempts + 1 })
      out.failed++
    }
  }
  return out
}

/** Cierra una cuenta de cobro a partir de la IPN de su pago (`orderId` = fee-…). */
export async function settleFeeInvoiceFromWebhook(
  repo: FeeRepo,
  hook: NormalizedBillingWebhook,
): Promise<'paid' | 'failed' | 'ignored'> {
  const ref = parseFeeOrderId(hook.orderId)
  if (!ref || hook.outcome === 'pending') return 'ignored'
  const inv = await repo.getInvoice(ref.tenantId, ref.period)
  if (!inv || inv.status === 'paid' || inv.status === 'waived') return 'ignored'
  if (hook.outcome === 'succeeded') {
    await repo.updateInvoice(inv.id, { status: 'paid', last_error: null, provider_payment_id: hook.eventKey })
    await repo.markFeesCharged(inv.id)
    return 'paid'
  }
  await repo.updateInvoice(inv.id, { status: 'failed', last_error: 'Cobro rechazado' })
  return 'failed'
}

// ─── Repo sobre la BD de plataforma ───────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
const INV_COLS = 'id, tenant_id, period, amount_cents, currency, status, attempts, last_attempt_at'

export function makeFeeRepo(db: any): FeeRepo {
  const fail = (op: string, error: { message: string } | null) => { if (error) throw new Error(`[fee-repo] ${op}: ${error.message}`) }
  return {
    async listUninvoicedFees(before) {
      const { data, error } = await db.from('payment_fees').select('id, tenant_id, fee_cents').eq('status', 'accrued').is('invoice_id', null).lt('created_at', before)
      fail('listUninvoicedFees', error)
      return data ?? []
    },
    async getInvoice(tenantId, period) {
      const { data, error } = await db.from('fee_invoices').select(INV_COLS).eq('tenant_id', tenantId).eq('period', period).maybeSingle()
      fail('getInvoice', error)
      return data ?? null
    },
    async createInvoice(tenantId, period) {
      const { data, error } = await db.from('fee_invoices').insert({ tenant_id: tenantId, period }).select(INV_COLS).single()
      if (error?.code === '23505') {
        const again = await this.getInvoice(tenantId, period)
        if (again) return again
      }
      fail('createInvoice', error)
      return data
    },
    async attachFees(invoiceId, feeIds) {
      const { error } = await db.from('payment_fees').update({ invoice_id: invoiceId, status: 'invoiced' }).in('id', feeIds)
      fail('attachFees', error)
      const { data, error: e2 } = await db.from('payment_fees').select('fee_cents').eq('invoice_id', invoiceId)
      fail('sumFees', e2)
      const total = (data ?? []).reduce((s: number, r: any) => s + r.fee_cents, 0)
      const { error: e3 } = await db.from('fee_invoices').update({ amount_cents: total, updated_at: new Date().toISOString() }).eq('id', invoiceId)
      fail('setAmount', e3)
      return total
    },
    async listChargeable(maxAttempts, retryBefore) {
      const { data, error } = await db.from('fee_invoices').select(INV_COLS).in('status', ['pending', 'failed']).lt('attempts', maxAttempts)
        .or(`last_attempt_at.is.null,last_attempt_at.lt.${retryBefore}`)
      fail('listChargeable', error)
      return data ?? []
    },
    async updateInvoice(id, patch) {
      const { error } = await db.from('fee_invoices').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
      fail('updateInvoice', error)
    },
    async markFeesCharged(invoiceId) {
      const { error } = await db.from('payment_fees').update({ status: 'charged' }).eq('invoice_id', invoiceId)
      fail('markFeesCharged', error)
    },
    async getPaymentTokenRef(tenantId) {
      const { data, error } = await db.from('subscriptions').select('payment_token_ref').eq('tenant_id', tenantId).maybeSingle()
      fail('getPaymentTokenRef', error)
      return data?.payment_token_ref ?? null
    },
  }
}

export interface FeeInvoiceOverview extends FeeInvoice { tenantName: string; lastError: string | null }

export async function listRecentFeeInvoices(db: any, limit = 30): Promise<FeeInvoiceOverview[]> {
  const { data, error } = await db.from('fee_invoices').select(`${INV_COLS}, last_error, tenants(name)`).order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`[fee-repo] listRecent: ${error.message}`)
  return (data ?? []).map((r: any) => ({
    ...r,
    tenantName: (Array.isArray(r.tenants) ? r.tenants[0]?.name : r.tenants?.name) ?? r.tenant_id,
    lastError: r.last_error ?? null,
  }))
}
/* eslint-enable @typescript-eslint/no-explicit-any */
