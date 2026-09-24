# Checklist de Go-Live — MVP SaaS multi-tenant

> Runbook para validar el alta de un cliente real. Orden sugerido: **1 → 6**. Marca cada casilla al completar. Las secciones **[OPS]** requieren credenciales/paneles externos (tuyas); las **[APP]** ya están en código.

---

## 0. Prerrequisitos de infraestructura

- [ ] **Supabase · proyecto de TIENDA** (lo comparten `web` + `admin`): BD con RLS, Storage.
- [ ] **Supabase · proyecto de PLATAFORMA** (solo `console`): tablas `tenants`/`plans`/`subscriptions`.
- [ ] **Stack Auth (Hexclave) · 3 proyectos**: uno por app (`web`, `admin`, `console`).
- [ ] **3 despliegues** (Vercel u hosting): `web` (`*.merkiai.com` wildcard + dominios propios), `admin` (`admin.merkiai.com`), `console` (`console.merkiai.com`).
- [ ] **DNS wildcard** `*.merkiai.com` → despliegue de `web` (sin DNS por-tenant; los subdominios resuelven por wildcard).

## 1. Migraciones SQL aplicadas (proyecto de TIENDA)

- [ ] `01_schema.sql` (canónico) + seeds.
- [ ] `e17/01…11` **en orden** (tenant_id, RLS catálogo, UNIQUE por tenant, FK compuestas, RLS flujos con sesión, RLS contenido, config por tenant, RLS themes, RLS admin, RLS admin_all, `store_template`).
- [ ] Verificar: `select conname from pg_constraint where conname like '%_tenant_uk';` devuelve las claves por tenant; RLS activa en las 25 tablas.

## 2. Variables de entorno por app **[OPS]**

Comunes a `web` y `admin` (proyecto de tienda):

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Proyecto de tienda |
| `SUPABASE_JWT_SECRET` | **Legacy JWT secret** de Supabase. **Joya de la corona** (HU-228). Solo en web + admin. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo donde hay islas legítimas (admin: upload/internal; web: webhooks bootstrap) |
| `INTERNAL_API_SECRET` | **≥ 24 chars**, aleatorio. Igual en console + admin (server-to-server) |
| `CONTROL_PLANE_URL` | URL de `console` (para resolver host→tenant) — en `web` y `admin` |
| `NEXT_PUBLIC_SITE_URL` | URL del storefront (preview del Constructor, webhooks) |
| `DEFAULT_TENANT_ID` | `00000000-0000-0000-0000-000000000001` |

Específicas:

| App | Variables |
|---|---|
| **web** | `NEXT_PUBLIC_ROOT_DOMAIN`, `SKYDROPX_*`, `HEXCLAVE_*` (proyecto web), `TENANT_RESOLUTION_STRICT` |
| **admin** | `NEXT_PUBLIC_ADMIN_URL`, `HEXCLAVE_*` (proyecto admin), `NEXT_PUBLIC_FEATURE_PAGE_BUILDER` |
| **console** | `ADMIN_APP_URL` (URL del admin), `SUPABASE_*` (proyecto **plataforma**), `ADMIN_HEXCLAVE_SECRET_SERVER_KEY` + `NEXT_PUBLIC_ADMIN_HEXCLAVE_*` (proyecto **admin**, para crear Teams/invitar), `HEXCLAVE_*` (proyecto console, para su propio login) |

- [ ] Todas cargadas en cada despliegue. **Redeploy** tras cambiarlas (las `NEXT_PUBLIC_*` se inyectan en build).

## 3. Stack Auth en producción (HU-214) **[OPS]**

Para cada uno de los **3 proyectos** (web/admin/console):

- [ ] **OAuth de Google con keys propias** (no las *Shared keys* de dev) — quita la marca de Stack Auth y arregla el drop de cookie en el primer retorno.
- [ ] **Authorized redirect URIs** en Google Cloud por subdominio: `*.merkiai.com` (web), `admin.merkiai.com`, `console.merkiai.com`.
- [ ] **Trusted Domains** en Stack Auth (¡distinto de los redirect URIs de Google!): **web** = `*.merkiai.com` (wildcard, si lo soporta) + dominios propios; **admin** = solo `admin.merkiai.com`; **console** = solo `console.merkiai.com`; `localhost` en dev.
- [ ] **`cookieDomain` host-scoped** — **prohibido** `Domain=.merkiai.com` (filtraría sesiones de compradores entre tiendas).
- [ ] **Account-linking** por email verificado habilitado (evita `CONTACT_CHANNEL_ALREADY_USED…`).
- [ ] Proyecto **admin**: creación de Teams server-side habilitada (la consola crea el Team del tenant).
- [ ] **Secreto interno**: idealmente separar `PROVISIONING_API_SECRET` (console↔admin) del resto (HU-228, pendiente ops).

## 4. Flags de activación **[OPS]**

- [ ] **`TENANT_RESOLUTION_STRICT=true`** en `web` → un host sin tenant da **404** (no sirve el default). *(Actívalo solo cuando el control plane resuelva bien; con él, un fallo del control plane corta el host.)*
- [ ] **`NEXT_PUBLIC_FEATURE_PAGE_BUILDER=true`** en `admin` (opcional) → habilita el Constructor de páginas.

## 5. Verificación end-to-end (alta real de prueba) **[APP+OPS]**

- [ ] En **console**: crear un tenant de prueba (nombre, subdominio, email del dueño, plan). Debe reportar **éxito** (no "modo parcial"): crea `tenants` + Team en Stack Auth + invita al dueño.
- [ ] **HU-207**: el tenant nace con su config → verificar en la BD de tienda que existen filas `store_config`/`payment_config`/`shipping_config`/`admin_config` + página `home` con ese `tenant_id`.
- [ ] **HU-209**: el dueño acepta la invitación y entra a `admin.merkiai.com` → ve su panel (rol `super_admin`), **no** "Sin acceso".
- [ ] **Storefront**: `sub.merkiai.com` sirve la tienda del tenant (catálogo/config propios, **no** los del default). Un subdominio inexistente → 404/redirect.
- [ ] **Aislamiento**: crear un producto en el tenant de prueba → NO aparece en otra tienda ni en el default.
- [ ] **Pago de prueba** (sandbox de la pasarela activa): completar checkout → el **webhook** actualiza el pedido del tenant correcto (config de pasarela por tenant, RLS por host).
- [ ] **Email/OTP** (console): probar login con "Enviar código al correo" → ingresar código → entra *(HU-214g; confirmar la forma del `nonce` de Stack Auth)*.

## 6. Post-activación

- [ ] **Custodia de secretos** (HU-228): `SUPABASE_JWT_SECRET` e `INTERNAL_API_SECRET` guardados en el gestor, rotación agendada (90 días).
- [ ] **Monitoreo**: revisar logs de `/api/internal/*` (401/429) y errores de resolución de tenant.
- [ ] **Rollback**: si algo falla, `TENANT_RESOLUTION_STRICT=false` vuelve al modo interino (sirve el default) sin cortar tráfico mientras se corrige.

---

### Pendientes de código conocidos (no bloquean el MVP)
- `api/checkout` y `finalize-daviplata` siguen en service-role (creación de orden con `tenant_id` explícito, bajo riesgo cruzado) → migrar a `getMachineDb` con prueba en vivo (HU-227 resto).
- `reconcile` (cron): listado cross-tenant es platform-level legítimo; procesar por-orden con `order.tenant_id`.
- RLS de `storage.objects` por prefijo de path (hoy aislamiento por path a nivel de app).
- Facturación automática (HU-192/193/194): al inicio se puede cobrar manual.
