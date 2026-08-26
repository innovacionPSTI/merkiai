# @merkiai/tenancy

Contexto multi-tenant para Merkiai: emisión de JWT con claim `tenant_id`, clientes Supabase (plano de tienda vs control plane), resolución de tenant por host y **connection factory** por `db_ref`.

> **Estado:** PoC del spike **HU-171**. No cablear a producción hasta cerrar `docs/adr/ADR-001-auth-rls-multitenant.md`. Ver `PRODUCT_BACKLOG.md → Detalle E17 · Arquitectura de referencia`.

## Regla de oro (ADR-001)

El **plano de tienda** (`apps/web`, `apps/admin`) usa **siempre** `createTenantClient` (rol `authenticated`, sujeto a RLS) y **nunca** el service-role. `createPlatformClient` (service-role, omite RLS) es **exclusivo del control plane**.

## API

- `mintTenantJwt({ userId, tenantId, secret })` / `verifyTenantJwt(token, secret)` — JWT de Supabase con claim `tenant_id`.
- `createTenantClient({ url, anonKey, accessToken })` — cliente sujeto a RLS.
- `createPlatformClient({ url, serviceRoleKey })` — cliente del control plane (BD de plataforma).
- `resolveTenantByHost(host, resolver)` / `assertTenantContext(ctx)` — resolución y aserción (fail-closed).
- `resolveDbTarget(tenant, registry)` / `buildTenantClientOptions(...)` — routing por `db_ref`.

## Referencia — server action que emite el JWT (Next / Stack Auth)

```ts
'use server'
import { hexclaveServerApp } from '@/hexclave/server'
import { mintTenantJwt } from '@merkiai/tenancy'

export async function getSupabaseJwt(activeTeamId: string): Promise<string | null> {
  const user = await hexclaveServerApp.getUser()
  if (!user) return null
  const team = await user.getTeam(activeTeamId) // null si no es miembro
  if (!team) return null                        // fail-closed: sin tenant válido, sin token
  return mintTenantJwt({
    userId: user.id,
    tenantId: team.id,
    secret: process.env.SUPABASE_JWT_SECRET!,
  })
}
```

Luego el cliente Supabase del plano de tienda:

```ts
import { createTenantClient } from '@merkiai/tenancy'
const supabase = createTenantClient({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  accessToken: () => getSupabaseJwt(activeTeamId).then((t) => t ?? ''),
})
```

## Correr las pruebas (sin Supabase)

```bash
pnpm --filter @merkiai/tenancy test
```

Las pruebas (`src/__tests__/isolation.test.ts`) simulan la RLS con un almacén en memoria y verifican: aislamiento cross-tenant, fail-closed sin JWT, rechazo de token forjado, y el routing por `db_ref`.

## Validar contra Supabase real (cierre del spike)

1. Aplica `poc/policies.example.sql` en el SQL Editor del proyecto Supabase (plano de tienda).
2. Inserta filas para dos tenants (con service-role).
3. Emite un JWT con `mintTenantJwt` para el tenant A y consúltalo vía `createTenantClient`: debe ver **sólo** filas de A, aunque no filtres por `tenant_id`.
4. Confirma los riesgos del ADR: **firma HS256 vs llaves asimétricas** que acepta el proyecto, y `SET LOCAL` sobre el **pooler** para el fallback GUC.
