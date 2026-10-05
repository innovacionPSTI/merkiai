'use server'

import { getAdminUser } from '@/lib/auth'
import { resolvePreviewUrl } from '@/lib/preview'

const REASONS: Record<string, string> = {
  missing_secret: 'Falta PREVIEW_SIGNING_SECRET en el admin (debe coincidir con el de la tienda).',
  control_plane: 'Falta CONTROL_PLANE_URL/INTERNAL_API_SECRET o el control plane no responde.',
  no_host: 'La tienda no tiene subdominio ni dominio propio configurado (revísalo en la consola).',
}

/** Genera la URL de vista previa de la tienda del operador (HU-128). */
export async function getPreviewUrlAction(path = '/'): Promise<{ url?: string; error?: string }> {
  const u = await getAdminUser()
  if (!u) return { error: 'No autorizado.' }
  const r = await resolvePreviewUrl(u.tenantId, path)
  return r.ok ? { url: r.url } : { error: REASONS[r.reason] ?? 'No se pudo generar la vista previa.' }
}
