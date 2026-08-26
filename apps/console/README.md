# @merkiai/console — Control plane (operación de plataforma)

Consola interna de Merkiai (operador de plataforma): alta/listado/suspensión de tenants, resolución `host→tenant` para el plano de tienda y (roadmap) planes/billing/dominios. Corre sobre la **BD de plataforma** (proyecto Supabase propio) y su **propio proyecto de Stack Auth**.

## Rutas
- `/login` — login branded (Stack Auth).
- `/` — **Tenants**: alta, asignación de plan, suspender/reactivar (requiere `platform:operate`).
- `/planes` — **Planes**: catálogo + crear/editar plan (features/limits).
- Shell común (grupo `(dash)`): topbar con operador + logout, sidebar (Tenants · Planes · Dominios/Auditoría próximamente).
- `/api/internal/resolve-tenant?host=` — resolución host→tenant (server-to-server; `x-internal-secret`).
- `/api/internal/tenants` (GET/POST) · `/api/internal/tenants/[id]` (PATCH) — gestión de tenants.

## Variables de entorno (`.env.local` / Vercel)
```env
# Supabase — proyecto de PLATAFORMA (distinto al del plano de tienda)
NEXT_PUBLIC_SUPABASE_URL=https://<platform-db>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # service-role del proyecto plataforma

# API interna (mismo valor que apps/web)
INTERNAL_API_SECRET=<openssl rand -hex 32>

# Stack Auth — proyecto CONTROL-PLANE (operadores de plataforma)
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=proj_...
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=pck_...
HEXCLAVE_SECRET_SERVER_KEY=ssk_...
```

## Setup en Stack Auth (proyecto control-plane)
1. Crear un **tercer proyecto** de Stack Auth (`Merkiai Console`).
2. En **RBAC → Project Permissions**, crear el permiso **`platform:operate`**.
3. Otorgarlo a tu usuario operador — dashboard (Users → usuario → Permissions) **o** vía script:
   ```bash
   # desde apps/console (el usuario debe haberse registrado antes en /login)
   node --env-file=.env.local scripts/grant-operator.mjs operador@tu.com   # --revoke para quitar · --list para ver usuarios
   ```
4. (Opcional) Deshabilitar sign-up: la consola no permite auto-registro.

## Despliegue (Vercel)
- Root Directory: `apps/console` · Framework: Next.js.
- Build/Install los define `vercel.json` (`--filter=@merkiai/console`).
- Envs de arriba en el proyecto Vercel.
- Aplica los SQL de plataforma: `packages/database/supabase/platform/01_platform_schema.sql`, `02_tenant_domains.sql`, `03_plans.sql`.

## Seguridad
- `/api/internal/*` es **solo server-to-server**: rechaza peticiones con `Origin` y compara el secreto con **timing-safe**. No exponer públicamente.
- La consola (`/`) exige sesión Stack Auth + permiso `platform:operate`.
- `SUPABASE_SERVICE_ROLE_KEY` es de la **BD de plataforma** y vive **solo aquí**.

## Pruebas
```bash
pnpm --filter @merkiai/console test        # validación + guard interno
pnpm --filter @merkiai/console type-check
```
