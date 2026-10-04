import { cookies } from 'next/headers'
import { verifyPreviewToken } from '@merkiai/database'
import { resolveTenant } from '@/lib/tenant-context'

/** Cookie de vista previa (host-scoped). HU-128. Guarda el TOKEN por-tenant. */
export const PREVIEW_COOKIE = '__merkiai_preview'

/**
 * ¿La petición está en modo vista previa? La cookie **contiene el token** (no un
 * simple '1'): se **re-verifica contra el tenant del Host en cada request**, así
 * una cookie forjada a mano (`=1` o token de otro tenant) NO activa el preview.
 */
export async function isPreviewMode(): Promise<boolean> {
  try {
    const c = await cookies()
    const token = c.get(PREVIEW_COOKIE)?.value
    if (!token) return false
    const { tenantId } = await resolveTenant()
    return verifyPreviewToken(token, tenantId, process.env.PREVIEW_SIGNING_SECRET)
  } catch {
    return false
  }
}
