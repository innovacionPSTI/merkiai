/**
 * Puente consola → admin para aprovisionar el dueño de un tenant (HU-209).
 *
 * La consola tiene su propia BD (no ve `profiles`, que vive en la BD del admin).
 * Por eso delega en el admin la creación del `profiles` del dueño con rol de
 * acceso al panel, vía su API interna (`x-internal-secret`, server-to-server).
 */
export interface ProvisionOwnerInput {
  email: string
  tenantId: string
  role?: 'super_admin' | 'admin' | 'gestor_tienda' | 'vendedor' | 'miembro'
  fullName?: string
}

export async function provisionOwnerProfile(
  input: ProvisionOwnerInput,
): Promise<{ ok: boolean; error?: string }> {
  const base = (process.env.ADMIN_APP_URL ?? 'https://admin.merkiai.com').replace(/\/$/, '')
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return { ok: false, error: 'INTERNAL_API_SECRET no configurado en la consola.' }

  try {
    const res = await fetch(`${base}/api/internal/owners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      cache: 'no-store',
      // 'manual' evita que un redirect (p.ej. middleware del admin → /login) se
      // cuele como falso éxito: con manual, un 3xx queda como respuesta no-ok.
      redirect: 'manual',
      body: JSON.stringify({
        email: input.email,
        tenantId: input.tenantId,
        role: input.role ?? 'admin',
        fullName: input.fullName,
      }),
    })
    if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
      return { ok: false, error: `admin redirigió la petición (¿middleware pidiendo sesión?). Revisa que /api/internal quede fuera del guard.` }
    }
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { ok: false, error: `admin respondió ${res.status}${t ? `: ${t.slice(0, 140)}` : ''}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
