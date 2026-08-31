import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { createServerClient, getStoreConfig, ensureCustomer } from '@merkiai/database'
import { sendWelcomeEmail, buildEmailConfig } from '@/lib/email'
import { resolveTenant } from '@/lib/tenant-context'

/**
 * POST /api/auth/welcome
 *
 * Llamado desde el cliente justo después de un registro exitoso en Stack Auth.
 * Realiza tres acciones en orden:
 *
 * 1. Upsert en `customers` — crea o actualiza el registro del nuevo cliente
 *    en Supabase usando stack_id + email como claves de enlace.
 *
 * 2. Vincula pedidos previos — si el cliente ya había comprado como invitado
 *    con el mismo email, actualiza orders.customer_id para que su historial
 *    quede visible en /account/orders desde el primer día.
 *
 * 3. Email de bienvenida — envía el correo de bienvenida vía Resend
 *    (silencioso si Resend no está configurado).
 *
 * Body: { name?: string; email?: string; stackId?: string }
 *
 * NOTA: email y stackId se pasan desde el cliente para evitar race conditions
 * donde la cookie de sesión de Stack Auth aún no llega al servidor inmediatamente
 * después del registro. stackServerApp.getUser() se intenta primero; si retorna
 * null se usan los valores del body como fallback.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { name?: string; email?: string; stackId?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Body vacío o inválido — continuar con sesión de Stack Auth
    }

    // ── Obtener datos del usuario ─────────────────────────────────────────────
    // getUser() puede lanzar excepción (credenciales no configuradas, race condition, etc.)
    // Se aísla para que un fallo aquí no impida el upsert en customers.
    let sessionUser = null
    try {
      sessionUser = await stackServerApp.getUser()
    } catch {
      // Continuar con datos del body
    }

    // Fuente de verdad: sesión si existe, body como fallback
    const stackId = sessionUser?.id ?? body.stackId ?? null
    const email   = sessionUser?.primaryEmail ?? body.email ?? null
    const name    = body.name ?? sessionUser?.displayName ?? null

    if (!email) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 })
    }

    const displayName = name || email.split('@')[0]

    // HU-207: el comprador pertenece al TENANT resuelto por host, no al default.
    const { tenantId } = await resolveTenant()

    // ── 1+2. Alta del customer + vinculación de pedidos previos ───────────────
    // `ensureCustomer` hace el upsert por (tenant_id, stack_id/email) y vincula
    // pedidos del mismo email — todo acotado al tenant.
    let customer: { id: string } | null = null
    if (stackId) {
      customer = await ensureCustomer({ stackUserId: stackId, email, name: displayName, tenantId })
        .catch((e) => { console.error('[welcome] ensureCustomer:', e); return null })
    } else {
      // Sin stackId (race post-registro): upsert tenant-scoped por email.
      const supabase = createServerClient()
      const { data } = await supabase
        .from('customers')
        .upsert({ email, name: displayName, tenant_id: tenantId }, { onConflict: 'tenant_id,email' })
        .select('id')
        .single()
      customer = data ?? null
    }

    // ── 3. Email de bienvenida ────────────────────────────────────────────────
    // Solo se envía si hay sesión válida (para no enviar a emails del body no verificados)
    if (sessionUser) {
      const config = await getStoreConfig(createServerClient(), tenantId)
      if (config?.resend_api_key && config?.resend_from_email) {
        await sendWelcomeEmail(
          email,
          displayName,
          buildEmailConfig(config.resend_api_key, config.resend_from_email, config.store_name),
        )
      }
    }

    return NextResponse.json({ sent: !!sessionUser, synced: !!customer })
  } catch (err) {
    console.error('[welcome] error:', err)
    return NextResponse.json({ sent: false, synced: false }, { status: 200 })
  }
}
