import { createServerClient, type Db } from '../client'
import type { Coupon } from '../types'

export type { Coupon }

export type CreateCouponInput = {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount?: number
  max_uses?: number | null
  expires_at?: string | null
  active?: boolean
}

export type UpdateCouponInput = Partial<CreateCouponInput>

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getCoupons(db: Db = createServerClient()): Promise<Coupon[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Coupon[]
}

export async function getCouponByCode(code: string, db: Db = createServerClient()): Promise<Coupon | null> {
  const supabase = db
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', code)
    .maybeSingle()
  if (error) throw error
  return data as Coupon | null
}

// ─── Validate ─────────────────────────────────────────────────────────────────

export type CouponValidationResult =
  | { valid: true; coupon: Coupon; discount: number }
  | { valid: false; error: string }

export function validateCoupon(coupon: Coupon, orderSubtotal: number): CouponValidationResult {
  if (!coupon.active) return { valid: false, error: 'Cupón inactivo' }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'El cupón ha expirado' }
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: 'El cupón ha alcanzado el límite de usos' }
  }

  if (orderSubtotal < coupon.min_order_amount) {
    return {
      valid: false,
      error: `Monto mínimo de pedido: $${coupon.min_order_amount.toLocaleString('es-CO')}`,
    }
  }

  const discount =
    coupon.type === 'percentage'
      ? Math.round((orderSubtotal * coupon.value) / 100)
      : Math.min(coupon.value, orderSubtotal)

  return { valid: true, coupon, discount }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createCoupon(input: CreateCouponInput, db: Db = createServerClient()): Promise<Coupon> {
  const supabase = db
  const { data, error } = await supabase
    .from('coupons')
    .insert({ ...input, code: input.code.toUpperCase() })
    .select()
    .single()
  if (error) throw error
  return data as Coupon
}

export async function updateCoupon(id: number, input: UpdateCouponInput, db: Db = createServerClient()): Promise<Coupon> {
  const supabase = db
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { ...input }
  if (input.code) update.code = input.code.toUpperCase()
  const { data, error } = await supabase
    .from('coupons')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Coupon
}

export async function deleteCoupon(id: number, db: Db = createServerClient()): Promise<void> {
  const supabase = db
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
}

/** Incrementa el contador de usos de un cupón tras un pedido exitoso */
export async function incrementCouponUsage(code: string, db: Db = createServerClient()): Promise<void> {
  const supabase = db
  await supabase.rpc('increment_coupon_usage', { coupon_code: code }).throwOnError()
}
