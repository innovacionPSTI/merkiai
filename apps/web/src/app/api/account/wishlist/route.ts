import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getWishlist, addWishlistItems, removeWishlistItem, ensureCustomer } from '@merkiai/database'
import { getRequestUserDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

/**
 * Lista de deseos del usuario logueado (HU-103 v2). Provisioning con
 * `ensureCustomer` + operación con el cliente `authenticated` (RLS `wishlist_own`).
 * El invitado usa localStorage; al iniciar sesión el cliente llama a POST (merge).
 */
async function resolveBuyer(user: { id: string; primaryEmail: string; displayName: string | null }) {
  const { tenantId } = await resolveTenant()
  const customer = await ensureCustomer({ stackUserId: user.id, email: user.primaryEmail, name: user.displayName, tenantId }, getMachineDb(tenantId))
  const db = await getRequestUserDb(user.id)
  return { tenantId, customerId: customer.id, db }
}

/** GET → favoritos (tarjetas con disponibilidad) del usuario. */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { customerId, db } = await resolveBuyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })
  const items = await getWishlist(db, customerId).catch(() => [])
  return NextResponse.json({ items })
}

/** POST { product_ids: number[] } → fusiona favoritos (merge del localStorage al iniciar sesión). */
export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const ids: number[] = Array.isArray(body?.product_ids) ? body.product_ids.map(Number) : []
  const { tenantId, customerId, db } = await resolveBuyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })
  await addWishlistItems(db, customerId, ids, tenantId).catch(() => {})
  const items = await getWishlist(db, customerId).catch(() => [])
  return NextResponse.json({ ok: true, items })
}

/** DELETE { product_id } → quita un favorito. */
export async function DELETE(req: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const productId = Number(body?.product_id)
  if (!Number.isInteger(productId)) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
  const { customerId, db } = await resolveBuyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })
  await removeWishlistItem(db, customerId, productId).catch(() => {})
  return NextResponse.json({ ok: true })
}
