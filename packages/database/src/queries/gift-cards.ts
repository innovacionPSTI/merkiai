import type { Db } from '../client'

/**
 * Gift cards y saldo a favor (HU-148). Las gift cards tienen un saldo canjeable;
 * el saldo a favor es un ledger append-only por cliente (balance = suma de
 * deltas). La generación de código y el cálculo de canje son puros y testeables;
 * el canje real en el checkout (decremento atómico) es la fase 2. `db` se pasa
 * por parámetro (RLS por tenant).
 */

export interface GiftCard {
  id: number
  code: string
  initial_balance: number
  balance: number
  active: boolean
  note: string | null
  expires_at: string | null
  created_at: string
}

// Sin caracteres ambiguos (0/O, 1/I) para dictar/leer fácil.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Normaliza un código para comparar: mayúsculas, sin espacios/guiones. */
export function normalizeGiftCardCode(raw: string): string {
  return (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Genera un código legible agrupado (ej. ABCD-EFGH-JKLM). */
export function generateGiftCardCode(groups = 3, size = 4, rnd: () => number = Math.random): string {
  const part = () => Array.from({ length: size }, () => ALPHABET[Math.floor(rnd() * ALPHABET.length)]).join('')
  return Array.from({ length: groups }, part).join('-')
}

/** ¿La gift card puede canjearse ahora? Pura. */
export function isGiftCardRedeemable(gc: Pick<GiftCard, 'active' | 'balance' | 'expires_at'>, now: Date = new Date()): boolean {
  if (!gc.active || gc.balance <= 0) return false
  if (gc.expires_at && now.getTime() >= new Date(gc.expires_at).getTime()) return false
  return true
}

export interface RedemptionResult {
  giftCardApplied: number
  creditApplied: number
  /** Monto que queda por pagar tras aplicar gift card + saldo. */
  remaining: number
}

/**
 * Reparte el monto a pagar entre gift card y saldo a favor (pura). Aplica primero
 * la gift card y luego el saldo, sin exceder ninguno ni el monto adeudado.
 */
export function computeRedemption(amountDue: number, giftCardBalance: number, storeCredit: number): RedemptionResult {
  const due = Math.max(0, Math.round(amountDue))
  const giftCardApplied = Math.min(Math.max(0, giftCardBalance), due)
  const afterGc = due - giftCardApplied
  const creditApplied = Math.min(Math.max(0, storeCredit), afterGc)
  return { giftCardApplied, creditApplied, remaining: afterGc - creditApplied }
}

// ── Gift cards ────────────────────────────────────────────────────────────────

const GC_COLS = 'id, code, initial_balance, balance, active, note, expires_at, created_at'

export async function listGiftCards(db: Db): Promise<GiftCard[]> {
  const { data } = await db.from('gift_cards').select(GC_COLS).order('created_at', { ascending: false })
  return (data ?? []) as GiftCard[]
}

export async function getGiftCardByCode(code: string, db: Db): Promise<GiftCard | null> {
  const { data } = await db.from('gift_cards').select(GC_COLS).eq('code', normalizeGiftCardCode(code)).maybeSingle()
  return (data as GiftCard) ?? null
}

/** Emite una gift card con saldo inicial. Reintenta si el código colisiona. */
export async function issueGiftCard(
  input: { amount: number; note?: string | null; expires_at?: string | null },
  db: Db,
  tenantId: string,
): Promise<GiftCard> {
  const amount = Math.round(input.amount)
  if (!(amount > 0)) throw new Error('El monto de la gift card debe ser mayor que 0.')
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGiftCardCode()
    const { data, error } = await db
      .from('gift_cards')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ tenant_id: tenantId, code, initial_balance: amount, balance: amount, note: input.note ?? null, expires_at: input.expires_at ?? null } as any)
      .select(GC_COLS)
      .single()
    if (!error) return data as GiftCard
    if ((error as any).code !== '23505') throw error // colisión de código → reintentar
  }
  throw new Error('No se pudo generar un código único para la gift card.')
}

/**
 * Decrementa el saldo de una gift card de forma ATÓMICA (HU-148 Fase 2). El
 * UPDATE condicional (`balance >= amount`) evita sobre-canje por concurrencia:
 * si otra petición ya gastó el saldo, no afecta ninguna fila y devuelve 0.
 * Devuelve el monto efectivamente aplicado.
 */
export async function redeemGiftCard(giftCardId: number, amount: number, db: Db): Promise<number> {
  const amt = Math.round(amount)
  if (!(amt > 0)) return 0
  // Supabase JS no expresa `balance = balance - amt` directo: se hace con
  // lectura + escritura CONDICIONAL por el saldo actual (guard optimista de
  // igualdad). Si otra petición cambió el saldo, se reintenta con el valor nuevo.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row } = await db.from('gift_cards').select('balance, active, expires_at').eq('id', giftCardId).maybeSingle()
    if (!row) return 0
    const gc = row as { balance: number; active: boolean; expires_at: string | null }
    if (!isGiftCardRedeemable(gc)) return 0
    const applied = Math.min(gc.balance, amt)
    if (applied <= 0) return 0
    const next = gc.balance - applied
    const { data: updated } = await db
      .from('gift_cards')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ balance: next, updated_at: new Date().toISOString() } as any)
      .eq('id', giftCardId)
      .eq('balance', gc.balance) // guard optimista: solo si nadie cambió el saldo
      .select('id')
    if (updated && updated.length > 0) return applied
    // alguien más modificó el saldo → reintentar con el valor nuevo
  }
  return 0
}

/**
 * Canje ATÓMICO de gift card + saldo a favor (HU-298) vía RPC transaccional
 * (`redeem_store_value`): revalida vigencia/saldo con bloqueo de fila y aplica el
 * mínimo entre lo pedido y lo disponible, sin sobre-gasto por concurrencia.
 * Devuelve lo efectivamente aplicado. No lanza por falta de saldo (aplica 0).
 */
export async function redeemStoreValue(
  db: Db,
  input: { tenantId: string; giftCardId: number | null; giftCardAmount: number; customerId: string | null; storeCreditAmount: number; orderId: number | null },
): Promise<{ giftCardApplied: number; storeCreditApplied: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc('redeem_store_value', {
    p_tenant: input.tenantId,
    p_gift_card_id: input.giftCardId,
    p_gift_card_amount: Math.max(0, Math.round(input.giftCardAmount)),
    p_customer_id: input.customerId,
    p_store_credit_amount: Math.max(0, Math.round(input.storeCreditAmount)),
    p_order_id: input.orderId,
  })
  if (error) throw error
  const r = (data ?? {}) as { gift_card_applied?: number; store_credit_applied?: number }
  return { giftCardApplied: Number(r.gift_card_applied ?? 0), storeCreditApplied: Number(r.store_credit_applied ?? 0) }
}

/**
 * Reverso (compensación) de un canje previo (HU-298) vía RPC `refund_store_value`:
 * restituye el saldo de la gift card y abona de vuelta el saldo a favor. Se usa
 * cuando la creación del pedido falla tras aplicar el crédito. Best-effort.
 */
export async function refundStoreValue(
  db: Db,
  input: { tenantId: string; giftCardId: number | null; giftCardAmount: number; customerId: string | null; storeCreditAmount: number },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any).rpc('refund_store_value', {
    p_tenant: input.tenantId,
    p_gift_card_id: input.giftCardId,
    p_gift_card_amount: Math.max(0, Math.round(input.giftCardAmount)),
    p_customer_id: input.customerId,
    p_store_credit_amount: Math.max(0, Math.round(input.storeCreditAmount)),
  })
  if (error) throw error
}

export async function setGiftCardActive(id: number, active: boolean, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('gift_cards').update({ active, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

// ── Saldo a favor (store credit) ───────────────────────────────────────────────

/** Balance del cliente = suma de los deltas del ledger. */
export async function getStoreCreditBalance(customerId: string, db: Db): Promise<number> {
  const { data } = await db.from('store_credit_ledger').select('delta').eq('customer_id', customerId)
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.delta ?? 0), 0)
}

export interface StoreCreditEntry { id: number; delta: number; reason: string | null; order_id: number | null; created_at: string }

export async function listStoreCredit(customerId: string, db: Db): Promise<StoreCreditEntry[]> {
  const { data } = await db
    .from('store_credit_ledger')
    .select('id, delta, reason, order_id, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return (data ?? []) as StoreCreditEntry[]
}

// ── Conciliación de valor (HU-300 AC-5) ───────────────────────────────────────

export interface StoreValueReconciliation {
  giftCards: { issued: number; remaining: number; redeemed: number; count: number }
  storeCredit: { credited: number; consumed: number; balance: number }
}

/** Agrega los montos puros de gift cards + ledger de saldo. Pura. */
export function computeStoreValueReconciliation(
  giftCards: Array<{ initial_balance: number; balance: number }>,
  ledger: Array<{ delta: number }>,
): StoreValueReconciliation {
  const issued = giftCards.reduce((s, g) => s + Number(g.initial_balance ?? 0), 0)
  const remaining = giftCards.reduce((s, g) => s + Number(g.balance ?? 0), 0)
  let credited = 0
  let consumed = 0
  for (const l of ledger) {
    const d = Number(l.delta ?? 0)
    if (d >= 0) credited += d
    else consumed += -d
  }
  return {
    giftCards: { issued, remaining, redeemed: issued - remaining, count: giftCards.length },
    storeCredit: { credited, consumed, balance: credited - consumed },
  }
}

/** Reporte de valor emitido vs. canjeado (gift cards + saldo a favor) del tenant. */
export async function getStoreValueReconciliation(db: Db): Promise<StoreValueReconciliation> {
  const [gc, led] = await Promise.all([
    db.from('gift_cards').select('initial_balance, balance'),
    db.from('store_credit_ledger').select('delta'),
  ])
  return computeStoreValueReconciliation((gc.data ?? []) as any, (led.data ?? []) as any)
}

/** Registra un movimiento de saldo (+abono / −consumo). Append-only. */
export async function addStoreCredit(
  input: { customerId: string; delta: number; reason?: string; orderId?: number | null },
  db: Db,
  tenantId: string,
): Promise<void> {
  const delta = Math.round(input.delta)
  if (!delta) return
  const { error } = await db
    .from('store_credit_ledger')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ tenant_id: tenantId, customer_id: input.customerId, delta, reason: input.reason ?? 'manual', order_id: input.orderId ?? null } as any)
  if (error) throw error
}
