import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { ensureCustomer } from '@merkiai/database'
import { getRequestUserDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context';
import { getMachineDb } from '@/lib/machine-db'
import { storeCountries } from '@/lib/store-countries'
import { sanitizeCheckoutAddress } from '@/lib/shipping-address'

/**
 * PATCH/DELETE /api/account/addresses/[id] — editar/eliminar una dirección.
 * HU-156: provisioning con `ensureCustomer` + cliente `authenticated` (RLS
 * `addresses_own`, fail-closed); ownership por `customer_id`.
 */
async function buyer(user: { id: string; primaryEmail: string; displayName: string | null }) {
  const { tenantId } = await resolveTenant()
  const customer = await ensureCustomer({
    stackUserId: user.id, email: user.primaryEmail, name: user.displayName, tenantId,
  }, getMachineDb(tenantId))
  const db = await getRequestUserDb(user.id)
  return { customerId: customer.id, db, tenantId }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    let user = null
    try { user = await stackServerApp.getUser() } catch {}
    if (!user?.primaryEmail)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      label?: string; full_name?: string; phone?: string; address?: string
      city?: string; department?: string; postal_code?: string; is_default?: boolean
      country?: string; neighborhood?: string
    }

    const { customerId, db, tenantId } = await buyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })

    // La dirección debe pertenecer al cliente
    const { data: existing } = await db
      .from('customer_addresses').select('id')
      .eq('id', id).eq('customer_id', customerId).maybeSingle()
    if (!existing)
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })

    // HU-468 · al editar la dirección completa se aplican las reglas del país.
    let regional: Record<string, unknown> = {}
    if (body.address !== undefined) {
      const chk = sanitizeCheckoutAddress(body, body.phone, await storeCountries(tenantId), { phoneRequired: false })
      if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: 400 })
      regional = { country: chk.address.country, neighborhood: chk.address.neighborhood ?? null, phone_e164: chk.phoneE164, postal_code: chk.address.postal_code ?? null }
    }

    if (body.is_default) {
      await db.from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId).eq('is_default', true)
    }

    const { data: updated, error } = await db
      .from('customer_addresses')
      .update({
        ...(body.label !== undefined       ? { label: body.label || null }           : {}),
        ...(body.full_name                 ? { full_name: body.full_name }            : {}),
        ...(body.phone !== undefined       ? { phone: body.phone || null }            : {}),
        ...(body.address                   ? { address: body.address }                : {}),
        ...(body.city                      ? { city: body.city }                      : {}),
        ...(body.department !== undefined  ? { department: body.department || null }  : {}),
        ...(body.postal_code !== undefined ? { postal_code: body.postal_code || null }: {}),
        ...(body.is_default !== undefined  ? { is_default: body.is_default }          : {}),
        ...regional,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ address: updated })
  } catch (err) {
    console.error('[account/addresses PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    let user = null
    try { user = await stackServerApp.getUser() } catch {}
    if (!user?.primaryEmail)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { customerId, db } = await buyer({ id: user.id, primaryEmail: user.primaryEmail, displayName: user.displayName })

    const { error } = await db
      .from('customer_addresses').delete()
      .eq('id', id).eq('customer_id', customerId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/addresses DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
