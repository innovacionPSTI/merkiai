import { createServerClient } from '../client'
import type { CartItem } from '../types'

export type { CartItem }

export type UpsertCartItemInput = {
  customer_id: string
  variant_id: number
  product_id: number
  product_name: string
  variant_label: string
  qty: number
  price: number
  image_url?: string | null
}

export async function getCartItems(customerId: string): Promise<CartItem[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as CartItem[]
}

export async function upsertCartItem(input: UpsertCartItemInput): Promise<CartItem> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(input, { onConflict: 'customer_id,variant_id' })
    .select()
    .single()
  if (error) throw error
  return data as CartItem
}

export async function removeCartItem(customerId: string, variantId: number): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('customer_id', customerId)
    .eq('variant_id', variantId)
  if (error) throw error
}

export async function clearCart(customerId: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('customer_id', customerId)
  if (error) throw error
}

export async function replaceCart(customerId: string, items: UpsertCartItemInput[]): Promise<void> {
  const supabase = createServerClient()

  // Deduplicar por variant_id (sumando cantidades). El payload del cliente puede
  // traer el mismo variant repetido (fusión de carrito invitado + BD, cambios de
  // variante, etc.); sin esto, insertar dos filas con la misma (customer_id,
  // variant_id) viola el unique constraint (error 23505).
  const merged = new Map<number, UpsertCartItemInput>()
  for (const it of items) {
    const prev = merged.get(it.variant_id)
    if (prev) prev.qty += it.qty
    else merged.set(it.variant_id, { ...it })
  }
  const deduped = [...merged.values()]

  // 1. Borrar todo el carrito actual
  await supabase.from('cart_items').delete().eq('customer_id', customerId)
  // 2. Upsert de los ítems nuevos (a prueba de carreras / filas residuales)
  if (deduped.length === 0) return
  const { error } = await supabase
    .from('cart_items')
    .upsert(deduped, { onConflict: 'customer_id,variant_id' })
  if (error) throw error
}
