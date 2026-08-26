# Identidad: abstracción, operaciones por API vs dashboard, y migración de proveedor

> Cómo queda la identidad a nivel de arquitectura para que migrar de Stack Auth a otro proveedor sea fácil, y qué operaciones de seguridad de tenants se pueden automatizar desde nuestra API vs cuáles solo se hacen en el dashboard del proveedor.

## 1. Abstracción `IdentityProvider` (para migrar de proveedor)

El código depende de la interfaz **`IdentityProvider`** (`@merkiai/tenancy/identity`), no de Stack Auth. Mismo patrón interfaz+factory que pagos/email/billing.

- **Interfaz (agnóstica):** `getCurrentUser`, `hasPlatformPermission`, `hasOrgPermission`, y provisioning `createOrg`, `addMember`, `grantOrgPermission`, `inviteMember?`, `setOrgMetadata?`. Vocabulario neutral: *org* = tenant (en Stack Auth = Team); *platform permission* = permiso global; *org permission* = permiso por org.
- **Adaptador Stack Auth:** `apps/console/src/lib/identity.ts` (`stackIdentity(app)`), único archivo acoplado a Stack Auth para identidad. Es **parametrizable por proyecto**: sesión/permiso de plataforma usa el proyecto del console; el provisioning de orgs usa el proyecto **admin** (donde viven los operadores de tienda).
- **Consumidores** (`platform-auth.ts`, provisioning, guards) usan la interfaz. **Migrar** = escribir un nuevo adaptador (Auth0/FusionAuth/Clerk/propio) y cambiar el factory; los consumidores no cambian.

**Lo que ya ayuda a la portabilidad (buenas prácticas aplicadas):**
- La UI de login (`LoginScreen`) es **presentacional**: recibe los handlers de auth por props → cambiar de proveedor no toca el diseño.
- El **aislamiento de datos** vive en Supabase RLS por claim `tenant_id`, **no** en el proveedor de identidad: el proveedor solo emite el token con el claim. Cambiar de proveedor no cambia la RLS.
- **Roles/permisos** se referencian por **IDs de permiso neutrales** (`platform:operate`, `store:admin`) — cualquier proveedor con RBAC los mapea.

**Lo específico de proveedor (a re-implementar al migrar):** el SDK cliente (`StackProvider`, `useStackApp`, `/handler/*`) y el minteo/validación del JWT. Está acotado a: el adaptador, `stack.ts`, el layout (`StackProvider`) y el handler.

## 2. Seguridad de tenants: qué se hace por API vs solo en el dashboard

### Automatizable desde NUESTRA API (server SDK, vía `IdentityProvider`)
Estas operaciones de *datos por tenant* se pueden hacer programáticamente en el flujo de onboarding/gestión:

- **Crear/eliminar org (tenant)** → `createOrg` (crea el Team).
- **Membresía**: agregar/quitar/invitar usuarios → `addMember`, `inviteMember`.
- **Asignar/revocar permisos** a un miembro → `grantOrgPermission` (y su revoke).
- **Metadata de la org** (espejar `tenant_id`/plan) → `setOrgMetadata`.

→ El **onboarding de un tenant** puede ser una sola operación de nuestra API: crear el Team (proyecto admin) + fila `tenants` (BD de plataforma) + seed de config + subdominio, y guardar `stack_team_id`.

### SOLO en el dashboard del proveedor (configuración, no per-tenant)
Estas son **configuración de proyecto**, una vez, no automatizables por API:

- **Definiciones de permisos** (crear los IDs `platform:operate`, `store:admin`… y su jerarquía). *La asignación sí es por API; la definición no.*
- **Proveedores OAuth** (Google client id/secret), **MFA/2FA**, **plantillas de email**, **política de sign-up**, **llaves de firma JWT / signing keys**, **dominios y redirect URLs** permitidos.

> Regla práctica: **definir** (permisos, providers, MFA, dominios) → dashboard, una vez por proyecto. **Operar** (crear tenants, miembros, asignar permisos) → nuestra API.

## 3. Estrategia de migración (checklist)

Si algún día se cambia de proveedor de identidad:
1. Escribir un nuevo **adaptador** que implemente `IdentityProvider`.
2. Reemplazar el **SDK cliente** (provider/handler/hooks) y el **minteo del JWT** (mantener el claim `tenant_id`, por lo que la RLS no cambia).
3. Recrear en el nuevo proveedor la **configuración** del §2 (permisos, providers, MFA, dominios).
4. **Migrar identidades** (usuarios/orgs) vía export/import del proveedor anterior + `createOrg`/`addMember` del nuevo adaptador.
5. Los consumidores (guards, provisioning, RLS, UI) **no cambian**.

Ámbito acotado del cambio: adaptador(es) + `stack.ts`/provider/handler + config del dashboard. Todo lo demás es agnóstico.
