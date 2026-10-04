'use server'

import { getAdminUser } from '@/lib/auth'
import { getPreviewUrl } from '@/lib/preview'

/** Genera la URL de vista previa de la tienda del operador (HU-128). */
export async function getPreviewUrlAction(path = '/'): Promise<{ url?: string; error?: string }> {
  const u = await getAdminUser()
  if (!u) return { error: 'No autorizado.' }
  const url = await getPreviewUrl(u.tenantId, path)
  return url
    ? { url }
    : { error: 'No se pudo generar la vista previa. Revisa el control plane y PREVIEW_SIGNING_SECRET.' }
}
