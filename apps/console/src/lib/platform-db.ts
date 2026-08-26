/**
 * Cliente de la BD de PLATAFORMA (service-role). Exclusivo del control plane.
 * Nunca debe existir un equivalente en el plano de tienda (apps/web|admin).
 */
import { createPlatformClient } from '@merkiai/tenancy'

export function platformDb() {
  return createPlatformClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  })
}
