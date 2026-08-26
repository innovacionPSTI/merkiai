import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getCartItems, replaceCart, clearCart, ensureCustomer } from '@merkiai/database'
import { getRequestUserDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'

/**
 * Sincroniza el carrito del usuario logueado con la BD (HU-156).
 * Provisioning con `ensureCustomer` (evita 404) y operación con el cliente
 * `authenticated` (RLS `cart_own`) cuando `SESSION_RLS_ENABLED` está activo; si
 * no, service-role. Las escrituras llevan `tenant_id` explícito.
 */
async function resolveBuyer(user: { id: string; primaryEmail: string; displayName: string | null }) {
  const { tenantId } = await resolveTenant()
  const customer = await ensureCustomer({
    stackUserId: user.id, email: user.primaryEmail, name: user.displayName, tenantId,
  })
  const db = await getRequestUserDb(user.id)
  return { tenantId, customerId: customer.id, db }
}

/** GET /api/account/cart — carrito en BD del usuario logueado */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { customerId, db } = await resolveBuyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })
  const items = await getCartItems(customerId, db)
  return NextResponse.json({ items })
}

/** POST /api/account/cart — reemplaza el carrito completo en BD */
export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { items } = await req.json()
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items requerido' }, { status: 400 })

  const { tenantId, customerId, db } = await resolveBuyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })

  // Descarta ítems sin IDs válidos (no satisfacen las FKs).
  const validItems = items.filter(
    (i) => i.productId && i.productId > 0 && i.variantId && i.variantId > 0,
  )

  await replaceCart(
    customerId,
    validItems.map((i) => ({
      customer_id: customerId,
      tenant_id: tenantId,
      variant_id: i.variantId,
      product_id: i.productId,
      product_name: i.productName,
      variant_label: i.variantLabel,
      qty: i.qty,
      price: i.price,
      image_url: i.imageUrl ?? null,
    })),
    db,
  )

  return NextResponse.json({ ok: true })
}

/** DELETE /api/account/cart — vacía el carrito en BD */
export async function DELETE() {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { customerId, db } = await resolveBuyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })
  await clearCart(customerId, db)
  return NextResponse.json({ ok: true })
}
