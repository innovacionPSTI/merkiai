import { cookies } from 'next/headers'

/** Cookie de vista previa (host-scoped). HU-128. */
export const PREVIEW_COOKIE = '__merkiai_preview'

/** ¿La petición está en modo vista previa? (cookie puesta por /api/preview). */
export async function isPreviewMode(): Promise<boolean> {
  try {
    const c = await cookies()
    return c.get(PREVIEW_COOKIE)?.value === '1'
  } catch {
    return false
  }
}
