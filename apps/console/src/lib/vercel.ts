/**
 * Aprovisionamiento de dominios en Vercel (HU-174 v2).
 *
 * Por qué: Vercel enruta una petición al deployment SOLO si el `Host` pertenece
 * a un dominio dado de alta en el proyecto. El wildcard `*.merkiai.com` cubre
 * todos los subdominios (una sola alta), pero cada **dominio propio** del tenant
 * debe **registrarse en el proyecto** para que Vercel lo acepte y emita el
 * certificado. Sin esto, apuntar el DNS a la IP de Vercel devuelve
 * `DEPLOYMENT_NOT_FOUND` aunque la resolución host→tenant de la app sea correcta.
 *
 * Config (secretos de plataforma, env de la consola):
 *   VERCEL_API_TOKEN   — token con acceso al proyecto del storefront.
 *   VERCEL_PROJECT_ID  — id del proyecto `apps/web` (la tienda pública).
 *   VERCEL_TEAM_ID     — (opcional) id del team/scope.
 * Si faltan, las funciones hacen no-op (`skipped: true`) para no romper dev/tests.
 */
export type Fetch = typeof fetch

export interface VercelResult {
  ok: boolean
  skipped?: boolean
  error?: string
  /** Pasos de verificación que pide Vercel (si el dominio aún no está configurado). */
  verification?: unknown
  /** Vercel ya considera el dominio verificado/configurado. */
  verified?: boolean
}

function cfg() {
  return {
    token: process.env.VERCEL_API_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID,
  }
}

function teamQS(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : ''
}

/**
 * Da de alta `domain` en el proyecto del storefront. Idempotente: si Vercel
 * responde que el dominio ya está en el proyecto, se trata como éxito.
 */
export async function addDomainToVercel(domain: string, doFetch: Fetch = fetch): Promise<VercelResult> {
  const { token, projectId, teamId } = cfg()
  if (!token || !projectId) return { ok: true, skipped: true }

  try {
    const res = await doFetch(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains${teamQS(teamId)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain }),
      },
    )
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      return { ok: true, verified: Boolean((data as { verified?: boolean }).verified), verification: (data as { verification?: unknown }).verification }
    }
    // Ya existe en el proyecto → idempotente.
    const code = (data as { error?: { code?: string } }).error?.code
    if (res.status === 409 || code === 'domain_already_in_use' || code === 'domain_already_exists') {
      return { ok: true }
    }
    return { ok: false, error: (data as { error?: { message?: string } }).error?.message ?? `Vercel ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Quita `domain` del proyecto del storefront (al desactivar el dominio propio). */
export async function removeDomainFromVercel(domain: string, doFetch: Fetch = fetch): Promise<VercelResult> {
  const { token, projectId, teamId } = cfg()
  if (!token || !projectId) return { ok: true, skipped: true }

  try {
    const res = await doFetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${teamQS(teamId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    )
    if (res.ok || res.status === 404) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: (data as { error?: { message?: string } }).error?.message ?? `Vercel ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
