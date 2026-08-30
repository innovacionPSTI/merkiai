/**
 * POST /api/internal/owners — Alta/actualización del dueño de un tenant (HU-209).
 *
 * Lo invoca la **consola (control plane)** al aprovisionar/asignar dueño: como la
 * consola tiene su propia BD (no ve `profiles`), delega en el admin la creación
 * de la fila `profiles` con rol de acceso al panel, ligada al `tenant_id`.
 *
 * Auth: `x-internal-secret` (server-to-server) + rate-limit + fail-closed si el
 * secreto no está bien configurado. Este endpoint ES el único autorizado a asignar
 * `super_admin` (el admin no puede); nunca degrada un super_admin ya existente.
 */
import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@merkiai/database'
import { withInternalAuth } from '@/lib/internal-route'

/**
 * Roles que el CONTROL PLANE puede asignar a un dueño. Incluye `super_admin`
 * a propósito: el admin tiene prohibido crearlo (anti-escalada en /usuarios),
 * así que el único origen válido del super_admin de una tienda es este endpoint.
 */
const OWNER_ASSIGNABLE = ['super_admin', 'admin', 'gestor_tienda', 'vendedor', 'miembro'] as const
type OwnerRole = (typeof OWNER_ASSIGNABLE)[number]

export const POST = withInternalAuth(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string
    tenantId?: string
    role?: string
    fullName?: string
  }
  const email = String(body.email ?? '').trim().toLowerCase()
  const tenantId = String(body.tenantId ?? '').trim()
  const role = String(body.role ?? 'admin')
  const fullName = body.fullName ? String(body.fullName) : null

  if (!email || !tenantId) {
    return NextResponse.json({ error: 'email y tenantId son requeridos' }, { status: 400 })
  }
  if (!OWNER_ASSIGNABLE.includes(role as OwnerRole)) {
    return NextResponse.json({ error: 'Rol no asignable' }, { status: 400 })
  }

  const supabase = createServerClient()

  // profiles es único por (tenant_id, email): resolvemos dentro del tenant.
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (existing) {
    // Nunca degradar/alterar a un super_admin desde el control plane.
    if (existing.role === 'super_admin') {
      return NextResponse.json({ ok: true, unchanged: true, reason: 'super_admin' })
    }
    const { error } = await supabase
      .from('profiles')
      .update({ role: role as OwnerRole, ...(fullName ? { full_name: fullName } : {}) })
      .eq('email', email)
      .eq('tenant_id', tenantId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, updated: true })
  }

  const { error } = await supabase.from('profiles').insert({
    id: randomUUID(),
    email,
    full_name: fullName,
    role: role as OwnerRole,
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, created: true }, { status: 201 })
})
