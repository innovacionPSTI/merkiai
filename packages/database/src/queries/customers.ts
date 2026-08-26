import { createServerClient, type Db } from '../client'

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export interface EnsureCustomerInput {
  /** ID del usuario en Stack Auth (`sub` del JWT). */
  stackUserId: string
  email: string
  name?: string | null
  /** Tenant activo (resuelto por host en el plano de tienda). */
  tenantId?: string
}

/**
 * Provisioning idempotente del `customer` de un usuario autenticado (HU-156 / E12).
 *
 * Resuelve/crea la fila en `customers` y devuelve su `id`, además de **reclamar
 * los pedidos de invitado** previos con el mismo email (backfill de
 * `orders.customer_id`). Debe ejecutarse con service-role (omite RLS): es el
 * puente que enlaza Stack Auth ↔ `customers` ↔ `orders`.
 *
 * Orden de resolución (dentro del tenant):
 *   1. por `stack_id` → ya vinculado.
 *   2. por `email` sin `stack_id` (cliente creado como invitado) → se le adjunta
 *      el `stack_id` (vincula la cuenta recién creada a su historial).
 *   3. si no existe → se inserta.
 */
export async function ensureCustomer(
  input: EnsureCustomerInput,
  db: Db = createServerClient(),
): Promise<{ id: string }> {
  const { stackUserId, email, name = null } = input
  const tenantId = input.tenantId ?? DEFAULT_TENANT_ID
  if (!stackUserId) throw new Error('[customers] stackUserId requerido')
  if (!email) throw new Error('[customers] email requerido')

  const sb = db

  // 1) ya vinculado por stack_id
  const byStack = await sb
    .from('customers').select('id')
    .eq('tenant_id', tenantId).eq('stack_id', stackUserId)
    .maybeSingle()
  if (byStack.data?.id) {
    await claimGuestOrders(db, tenantId, email, byStack.data.id)
    return { id: byStack.data.id }
  }

  // 2) existe por email (posible cliente-invitado) → adjuntar stack_id
  const byEmail = await sb
    .from('customers').select('id, stack_id')
    .eq('tenant_id', tenantId).eq('email', email)
    .maybeSingle()
  if (byEmail.data?.id) {
    if (!byEmail.data.stack_id) {
      await sb.from('customers')
        .update({ stack_id: stackUserId, ...(name ? { name } : {}) })
        .eq('id', byEmail.data.id)
    }
    await claimGuestOrders(db, tenantId, email, byEmail.data.id)
    return { id: byEmail.data.id }
  }

  // 3) crear
  const created = await sb
    .from('customers')
    .insert({ stack_id: stackUserId, email, name, tenant_id: tenantId })
    .select('id').single()

  if (created.error) {
    // Carrera: otro request lo creó entre el select y el insert → re-resolver.
    const retry = await sb
      .from('customers').select('id')
      .eq('tenant_id', tenantId).eq('stack_id', stackUserId)
      .maybeSingle()
    if (retry.data?.id) return { id: retry.data.id }
    throw created.error
  }

  await claimGuestOrders(db, tenantId, email, created.data.id)
  return { id: created.data.id }
}

/**
 * Reclama (best-effort) los pedidos de invitado del mismo email que aún no tienen
 * `customer_id`, enlazándolos al cliente. No bloquea el flujo si falla.
 */
async function claimGuestOrders(db: Db, tenantId: string, email: string, customerId: string): Promise<void> {
  try {
    await db.from('orders')
      .update({ customer_id: customerId })
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .is('customer_id', null)
  } catch {
    /* non-critical */
  }
}
