import type { Db } from '../client'
import type { Order, OrderItem, ShippingAddress } from '../types'

export interface CreateOrderInput {
  /** Tenant del pedido (E17). Si se omite, la BD usa el tenant por defecto. */
  tenant_id?: string
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_addr: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  discount?: number
  total: number
  payment_method?: 'wompi' | 'mercadopago' | 'tucompra' | 'bold' | 'manual'
  skydropx_rate_id?: string | null
  carrier_name?: string | null
  coupon_code?: string | null
}

export async function createOrder(input: CreateOrderInput, db: Db): Promise<Order> {
  const supabase = db

  // Número de orden atómico: RPC con secuencia + prefijo configurable
  // (store_config.order_prefix). Evita colisiones del antiguo COUNT(*)+1.
  const { data: generated, error: seqError } = await supabase.rpc('generate_order_number')
  if (seqError || !generated) {
    throw seqError ?? new Error('No se pudo generar el número de orden')
  }
  const orderNumber = generated as unknown as string

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      ...input,
      discount: input.discount ?? 0,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as unknown as Order
}

export async function getOrdersByCustomer(customerId: string, db: Db): Promise<Order[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Order[]
}

/**
 * Obtiene los pedidos de un cliente por su email.
 * Usado desde /account/orders cuando el usuario está autenticado con Stack Auth
 * y sus órdenes históricas se vincularon por email (no por ID de Stack).
 */
export async function getOrdersByCustomerEmail(email: string, db: Db): Promise<Order[]> {
  const supabase = db
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', email.toLowerCase())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Order[]
}

export interface GuestOrderView {
  order_number: string
  status: string
  payment_status: string | null
  created_at: string
  tracking_number: string | null
  carrier_name: string | null
  items: { product_name: string; variant_label: string; qty: number }[]
  total: number
}

/**
 * HU-150 · Consulta de pedido como invitado. Devuelve un subconjunto SEGURO del
 * pedido solo si el número y el email coinciden exactamente (verificación
 * server-side, sin enumeración). No expone dirección, teléfono ni correo.
 * `db` debe poder leer el pedido (service-role/machine-db del plano de tienda).
 */
export async function getOrderForGuest(
  db: Db,
  orderNumber: string,
  email: string,
  tenantId: string,
): Promise<GuestOrderView | null> {
  const num = orderNumber.trim()
  const mail = email.trim().toLowerCase()
  if (!num || !mail) return null
  const { data, error } = await db
    .from('orders')
    .select('order_number, status, payment_status, created_at, tracking_number, carrier_name, items, total')
    .eq('tenant_id', tenantId)
    .eq('order_number', num)
    .eq('customer_email', mail)
    .maybeSingle()
  if (error || !data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  const items = Array.isArray(d.items) ? d.items : []
  return {
    order_number: d.order_number,
    status: d.status,
    payment_status: d.payment_status ?? null,
    created_at: d.created_at,
    tracking_number: d.tracking_number ?? null,
    carrier_name: d.carrier_name ?? null,
    items: items.map((i: { product_name?: string; variant_label?: string; qty?: number }) => ({
      product_name: i.product_name ?? '',
      variant_label: i.variant_label ?? '',
      qty: Number(i.qty) || 0,
    })),
    total: Number(d.total) || 0,
  }
}

export async function getOrderById(id: number, db: Db) {
  const supabase = db
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as Order
}

export async function updateOrderStatus(
  id: number,
  status: Order['status'],
  extra: Partial<Omit<Order, 'id' | 'created_at'>> = {}, db: Db
) {
  const supabase = db
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Order
}
