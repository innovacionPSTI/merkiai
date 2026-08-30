/**
 * Tenant activo del admin (HU-158). El operador puede pertenecer a varias
 * tiendas (Teams = tenants); la elegida se guarda en cookie httpOnly y acota
 * el contexto del panel. Reemplaza el `ADMIN_TENANT_ID` estático.
 */
import { cookies } from 'next/headers'

export const ACTIVE_TENANT_COOKIE = 'merkiai_active_tenant'
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

/** Tenant activo (cookie) o el por defecto (single-tenant interino). */
export async function getActiveTenantId(): Promise<string> {
  try {
    const c = await cookies()
    return c.get(ACTIVE_TENANT_COOKIE)?.value || DEFAULT_TENANT_ID
  } catch {
    return DEFAULT_TENANT_ID
  }
}

/** Lee el tenant activo sin fallback (null si no hay cookie). */
export async function readActiveTenantId(): Promise<string | null> {
  try {
    const c = await cookies()
    return c.get(ACTIVE_TENANT_COOKIE)?.value ?? null
  } catch {
    return null
  }
}

/** Fija el tenant activo (solo en server actions / route handlers). */
export async function setActiveTenantId(tenantId: string): Promise<void> {
  const c = await cookies()
  c.set(ACTIVE_TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })
}
