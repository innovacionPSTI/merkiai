import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { createServerClient, ensureCustomer } from '@merkiai/database'
import { getRequestUserDb } from '@/lib/tenant-db'
import { resolveTenant } from '@/lib/tenant-context'

/**
 * GET /api/account/profile — nombre/teléfono/email del customer logueado.
 * PATCH /api/account/profile — actualiza nombre y teléfono.  Body: { name?, phone? }
 *
 * HU-156: se asegura la fila en `customers` (provisioning) y se opera con el
 * cliente `authenticated` (RLS `customers_own`) cuando `SESSION_RLS_ENABLED`
 * está activo; si no, service-role (comportamiento actual). Ownership por id.
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

    const db = (await getRequestUserDb(user.id)) ?? createServerClient()
    const { data } = await db
      .from('customers').select('name, phone, email').eq('id', customer.id).maybeSingle()

    return NextResponse.json({
      name:  data?.name  ?? user.displayName ?? '',
      phone: data?.phone ?? '',
      email: data?.email ?? user.primaryEmail,
    })
  } catch (err) {
    console.error('[account/profile GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let user = null
    try { user = await stackServerApp.getUser() } catch { /* no session */ }
    if (!user?.primaryEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { name?: string; phone?: string }

    const { tenantId } = await resolveTenant()
    const customer = await ensureCustomer({
      stackUserId: user.id, email: user.primaryEmail, name: user.displayName, tenantId,
    })

    const db = (await getRequestUserDb(user.id)) ?? createServerClient()
    const { error } = await db
      .from('customers')
      .update({
        name:       body.name  ?? undefined,
        phone:      body.phone ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id)

    if (error) throw error

    // Sincroniza displayName en Stack Auth si cambió el nombre (no crítico).
    if (body.name) {
      try { await user.update({ displayName: body.name }) } catch { /* non-critical */ }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/profile PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
