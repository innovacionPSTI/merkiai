/**
 * Cliente de datos **de máquina, acotado por tenant vía RLS** (HU-227).
 *
 * Para las "islas" del storefront que NO tienen sesión de usuario (webhooks,
 * reconcile, endpoints públicos que tocan datos del tenant) pero SÍ conocen el
 * tenant (por `order.tenant_id` o por host). Reemplaza a `createServerClient()`
 * (service-role, que OMITE RLS → sin red de seguridad): acuña un JWT con
 * `role: 'authenticated'`, el claim `tenant_id` y `is_admin: true` (máquina), de
 * modo que las políticas RLS `*_admin_all` acotan CRUD a SU tenant. Así, aunque
 * se olvide un `.eq('tenant_id')`, el motor bloquea el cruce (fail-safe).
 *
 * El JWT se firma **solo en el servidor** y nunca se expone al cliente.
 * Fail-closed: exige `SUPABASE_JWT_SECRET`; si falta, lanza (no degrada a
 * service-role).
 */
import { createTenantClient, mintTenantJwt } from '@merkiai/tenancy'
import type { Database } from '@merkiai/database/types'

export function getMachineDb(tenantId: string, machineId = 'web-machine') {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('[web] SUPABASE_JWT_SECRET requerido: las islas usan RLS por tenant (sin service-role).')
  }
  if (!tenantId) {
    throw new Error('[web] getMachineDb requiere tenantId (de order.tenant_id o del host).')
  }
  return createTenantClient<Database>({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    accessToken: () =>
      mintTenantJwt({
        userId: machineId,
        tenantId,
        secret,
        role: 'authenticated',
        claims: { is_admin: true },
      }),
  })
}
