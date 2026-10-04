# Checklist de Go-Live — MVP SaaS multi-tenant

> Runbook para validar el alta de un cliente real. Orden sugerido: **1 → 6**. Marca cada casilla al completar. Las secciones **[OPS]** requieren credenciales/paneles externos (tuyas); las **[APP]** ya están en código.

---

## 0. Prerrequisitos de infraestructura

- [ ] **Supabase · proyecto de TIENDA** (lo comparten `web` + `admin`): BD con RLS, Storage.
- [ ] **Supabase · proyecto de PLATAFORMA** (solo `console`): tablas `tenants`/`plans`/`subscriptions`.
- [ ] **Stack Auth (Hexclave) · 3 proyectos**: uno por app (`web`, `admin`, `console`).
- [ ] **3 despliegues** (Vercel u hosting): `web` (`*.merkiai.com` wildcard + dominios propios), `admin` (`admin.merkiai.com`), `console` (`console.merkiai.com`).
- [ ] **DNS wildcard** `*.merkiai.com` → despliegue de `web` (sin DNS por-tenant; los subdominios resuelven por wildcard).

## 1. Migraciones SQL

**Proyecto de TIENDA:**
- [ ] `01_schema.sql` (canónico) + seeds.
- [ ] `e17/01…11` **en orden** (tenant_id, RLS catálogo, UNIQUE por tenant, FK compuestas, RLS flujos con sesión, RLS contenido, config por tenant, RLS themes, RLS admin, RLS admin_all, `store_template`).
- [ ] **`e17/12_config_pk_por_tenant.sql`** ⭐ **NUEVO/OBLIGATORIO** — sin esto, crear config de un tenant nuevo falla (colisión del `id=1`); el admin da error al guardar y el seed no crea las 4 config. (Encontrado en la prueba del punto 5.)
- [ ] Verificar: `select conname from pg_constraint where conname like '%_tenant_pk';` lista `store_config_tenant_pk`, etc.
- [ ] **`e17/13_inventory_model.sql`** ⭐ **NUEVO** (HU-237) — columna `store_config.inventory_model` (`single`|`multi_location`, default `single`). Sin esto, aplicar un preset con modelo de inventario o el onboarding multi-ubicación fallan.
- [ ] **`e17/14_onboarding_state.sql`** ⭐ **NUEVO** (HU-236 v2) — columna `store_config.onboarding_state` (JSONB, nullable). Sin esto, el onboarding no persiste el progreso (preset aplicado / completado / omitido) y no es reanudable. No rompe lo demás si falta (fail-soft), pero el wizard siempre arranca de cero.

**Proyecto de PLATAFORMA (consola):**
- [ ] `platform/01_platform_schema.sql` + `03_plans.sql`.
- [ ] **`platform/04_owner_email.sql`** ⭐ **NUEVO** — columna `owner_email` para mostrar el dueño en el listado de la consola.
- [ ] **`platform/05_presets.sql`** ⭐ **NUEVO** (HU-233) — tabla `presets` (bundles curados por nicho que se aplican al crear tiendas).
- [ ] **`platform/06_custom_domains.sql`** ⭐ **NUEVO** (HU-174) — `tenants.domain_status`/`domain_verify_token`/`domain_requested` para la verificación de dominio propio.

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
| **web** | `NEXT_PUBLIC_ROOT_DOMAIN`, `HEXCLAVE_*` (proyecto web), `TENANT_RESOLUTION_STRICT`, `DRAFT_SECRET`, `MAINTENANCE_MODE` |
| **admin** | `NEXT_PUBLIC_ADMIN_URL`, `HEXCLAVE_*` (proyecto admin), `NEXT_PUBLIC_FEATURE_PAGE_BUILDER` |
| **console** | `ADMIN_APP_URL` (URL del admin), `SUPABASE_*` (proyecto **plataforma**), `ADMIN_HEXCLAVE_SECRET_SERVER_KEY` + `NEXT_PUBLIC_ADMIN_HEXCLAVE_*` (proyecto **admin**, para crear Teams/invitar), `HEXCLAVE_*` (proyecto console, para su propio login) |

- [ ] Todas cargadas en cada despliegue. **Redeploy** tras cambiarlas (las `NEXT_PUBLIC_*` se inyectan en build).

## 3. Stack Auth en producción (HU-214) **[OPS]**

Para cada uno de los **3 proyectos** (web/admin/console):

- [ ] **OAuth de Google con keys propias** (no las *Shared keys* de dev) — quita la marca de Stack Auth y arregla el drop de cookie en el primer retorno. *(Se puede dejar para el final; con Shared keys funciona en dev.)*
- [ ] **Authorized redirect URIs** en Google Cloud por subdominio: `*.merkiai.com` (web), `admin.merkiai.com`, `console.merkiai.com`. *(Va con las keys propias de Google.)*
- [x] **Trusted Domains** en Stack Auth (¡distinto de los redirect URIs de Google!): **web** = `*.merkiai.com` (wildcard, si lo soporta) + dominios propios; **admin** = solo `admin.merkiai.com`; **console** = solo `console.merkiai.com`; `localhost` en dev.
- [x] **`cookieDomain` host-scoped** — **YA correcto por defecto**: los `StackServerApp` usan `tokenStore: 'nextjs-cookie'` **sin** `cookieDomain` → cookies sin atributo `Domain` (host-scoped), y cada app es un proyecto Stack distinto. Nada que configurar; solo confirmar que el dashboard no fuerce un "custom cookie domain" compartido.
- [ ] **Account-linking** por email verificado — **en el dashboard de Stack Auth** (proyecto → Auth/OAuth). Evita `CONTACT_CHANNEL_ALREADY_USED…`. **Va JUNTO con el OAuth de Google** (déjalo para el final con las keys propias).
- [x] Proyecto **admin**: creación de Teams server-side habilitada (la consola crea el Team del tenant).
- [ ] **Secreto interno**: hoy el aprovisionamiento (console→admin) usa el **`INTERNAL_API_SECRET` compartido** — suficiente para el go-live. *(Opcional/futuro HU-228: separar un `PROVISIONING_API_SECRET` dedicado; NO implementado, no bloquea.)*

## 4. Flags de activación **[OPS]**

- [ ] **`TENANT_RESOLUTION_STRICT=true`** en `web` → un host sin tenant da **404** (no sirve el default). *(Actívalo solo cuando el control plane resuelva bien; con él, un fallo del control plane corta el host.)*
- [ ] **`NEXT_PUBLIC_FEATURE_PAGE_BUILDER=true`** en `admin` (opcional) → habilita el Constructor de páginas.

## 5. Verificación end-to-end (alta real de prueba) **[APP+OPS]** — ✅ VALIDADO (sep-2026)

- [x] En **console**: crear un tenant reporta **éxito** (crea `tenants` + Team en Stack Auth + invita al dueño); el listado muestra el **dueño** (`owner_email`).
- [x] **HU-207**: el tenant nace con sus **4 config** (`store/payment/shipping/admin_config`) + página `home`. *(Requirió `e17/12`: PK por tenant + drop del índice `shipping_config_singleton`.)*
- [x] **HU-209**: el dueño entra a `admin.merkiai.com` con rol `super_admin` (no "Sin acceso"); guarda config sin error.
- [x] **Storefront**: el subdominio sirve la tienda del tenant (config/tema propios); un subdominio inexistente → 404/redirect. *(Home sin secciones muestra fallbacks genéricos — ya sin "café"; contenido real vía Constructor / HU-234.)*
- [x] **Aislamiento**: producto creado en el tenant NO aparece en otra tienda (RLS confirmada).
- [ ] **Pago de prueba** — ⏸ **DIFERIDO** hasta refinar los medios de pago (PRV-07/HU-188).
- [ ] **Email/OTP** (console) — ⏸ **DIFERIDO** junto con el refinamiento de pagos/auth. El login por contraseña funciona.

> **Estado:** núcleo del alta multi-tenant **validado en vivo**. Pendientes deliberados: pago de prueba + Email/OTP (con el refinamiento de pagos) y OAuth de Google propio (punto 3).

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
