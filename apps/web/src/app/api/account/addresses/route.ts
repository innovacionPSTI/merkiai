import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { ensureCustomer } from '@merkiai/database'
import { getRequestUserDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'

/**
 * GET  /api/account/addresses — direcciones del cliente logueado (pre-llena checkout).
 * POST /api/account/addresses — guarda una nueva dirección.
 *
 * HU-156: provisioning del cliente + cliente `authenticated` (RLS `addresses_own`)
 * cuando `SESSION_RLS_ENABLED` está activo; si no, service-role. El insert lleva
 * `tenant_id` explícito para que la política `with check` y la FK compuesta
 * (customer_id, tenant_id) calcen en cualquier tenant.
 */
export async function GET() {
  try {
    let user = null
    try { user = await stackServerApp.getUser() } catch { /* no session */ }
    if (!user?.primaryEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenantId } = await resolveTenant()
    const customer = await ensureCustomer({
      stackUserId: user.id, email: user.primaryEmail, name: user.displayName, tenantId,
    })

    const db = await getRequestUserDb(user.id)
    const { data: addresses, error } = await db
      .from('customer_addresses').select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ addresses: addresses ?? [] })
  } catch (err) {
    console.error('[account/addresses GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let user = null
    try { user = await stackServerApp.getUser() } catch { /* no session */ }
    if (!user?.primaryEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      label?: string; full_name: string; phone?: string; address: string
      city: string; department?: string; postal_code?: string; is_default?: boolean
    }

    if (!body.full_name || !body.address || !body.city) {
      return NextResponse.json({ error: 'full_name, address y city son requeridos' }, { status: 400 })
    }

    const { tenantId } = await resolveTenant()
    const customer = await ensureCustomer({
      stackUserId: user.id, email: user.primaryEmail, name: user.displayName, tenantId,
    })

    const db = await getRequestUserDb(user.id)

    // Si la nueva es default, quitar el default anterior
    if (body.is_default) {
      await db.from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customer.id)
        .eq('is_default', true)
    }

    // Insert con tenant_id explícito (calza `with check` + FK compuesta).
    const { data: address, error } = await db
      .from('customer_addresses')
      .insert({
        customer_id: customer.id,
        label: body.label ?? null,
        full_name: body.full_name,
        phone: body.phone ?? null,
        address: body.address,
        city: body.city,
        department: body.department ?? null,
        postal_code: body.postal_code ?? null,
        is_default: body.is_default ?? false,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ address })
  } catch (err) {
    console.error('[account/addresses POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
