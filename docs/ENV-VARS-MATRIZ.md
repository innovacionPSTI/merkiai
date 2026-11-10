# Matriz de variables de entorno por proyecto y ambiente — Merkiai

> **Guard activo (HU-364):** `pnpm env:check` (y el job de CI) falla si una app usa una variable que no está en su `.env.example`. El rename `CONTROL_PLANE_URL → CONSOLE_URL` ya está en código con alias retrocompatible.
>
> **Estado (v256): casi definitiva.** Ya están en código HU-361 (infra por-tenant desde la
> consola), HU-362 (vault AWS KMS), el rename `CONTROL_PLANE_URL → CONSOLE_URL` (HU-364) y las
> variables de **billing PayZen** (HU-440). Falta para congelarla: retirar el alias
> `CONTROL_PLANE_URL`, mover `HOSTING_API_TOKEN` al vault y separar producción (ver §Roadmap).

## Leyenda

- **propio** — recurso propio y aislado de ese ambiente (su Supabase / su Stack).
- **= web / = admin** — mismo valor que esa app en el **mismo** ambiente.
- **compartido-<amb>** — mismo valor entre las 3 apps del **mismo** ambiente, distinto entre ambientes.
- **igual en los 3** — mismo valor en los tres ambientes.
- **omitir** — no cargar la variable.
- Secretos en **negrita** en la descripción.
- *(opcional)* — tiene default en código; cargar solo para cambiarlo.
- **llaves test PayZen** — PayZen solo tiene modo test y producción: dev y test usan las llaves de **test** de la misma tienda.

---

## merkiai-web (storefront)

| Variable | Descripción | prod | dev | test |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase de tienda | propio | propio | propio |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key de ese Supabase | propio | propio | propio |
| `SUPABASE_JWT_SECRET` | **JWT secret** que firma el claim `tenant_id` (RLS). Crítico | propio | propio | propio |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service-role** (omite RLS); solo islas sin sesión | propio | propio | propio |
| `CONSOLE_URL` | URL de la consola (resuelve host→tenant). Alias en retiro: `CONTROL_PLANE_URL` | console prod | console dev | console test |
| `INTERNAL_API_SECRET` | **Secreto server-to-server**. Igual en las 3 apps del ambiente | compartido-prod | compartido-dev | compartido-test |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Dominio raíz para subdominios por host | dominio prod | dominio dev | dominio test |
| `TENANT_RESOLUTION_STRICT` | Multi-tenant real fail-closed | `true` | `true` | `true` |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | Proyecto Stack **web/compradores** | propio | propio | propio |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | Client key de ese Stack web | propio | propio | propio |
| `HEXCLAVE_SECRET_SERVER_KEY` | **Server key** del Stack web | propio | propio | propio |
| `NEXT_PUBLIC_SITE_URL` | URL pública del storefront | prod | dev | test |
| `PREVIEW_SIGNING_SECRET` | **HMAC** del token de preview. Coincide con admin del ambiente | = admin-prod | = admin-dev | = admin-test |
| `ADMIN_PREVIEW_ORIGIN` | Origin del admin autorizado a incrustar el iframe de preview | admin prod | admin dev | admin test |
| `MAINTENANCE_MODE` | Cierra la tienda si `true` | `false` | `false` | `false` |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (+ `_ENVIRONMENT`, `_TRACES_SAMPLE_RATE`) | Observabilidad opcional (guarded) | opcional | omitir | omitir |
| ~~`DRAFT_SECRET`~~ | **Muerta** (reemplazada por preview por-tenant HU-128) | borrar | borrar | borrar |
| ~~`DEFAULT_TENANT_ID`~~ | Fallback single-tenant; no se usa en modo estricto | omitir | omitir | omitir |

## merkiai-admin (panel)

| Variable | Descripción | prod | dev | test |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase de **tienda** (misma BD que web del ambiente) | = web prod | = web dev | = web test |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon key de ese Supabase | = web | = web | = web |
| `SUPABASE_JWT_SECRET` | **JWT secret** (firma `is_admin`) | = web | = web | = web |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service-role** de tienda | = web | = web | = web |
| `INTERNAL_API_SECRET` | **Server-to-server**. Igual en las 3 apps del ambiente | compartido-prod | compartido-dev | compartido-test |
| `CONSOLE_URL` | URL de la consola del ambiente. Alias en retiro: `CONTROL_PLANE_URL` | console prod | console dev | console test |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | Proyecto Stack **admin** (≠ el de web) | propio | propio | propio |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | Client key del Stack admin | propio | propio | propio |
| `HEXCLAVE_SECRET_SERVER_KEY` | **Server key** del Stack admin. Aquí se crean los usuarios admin | propio | propio | propio |
| `NEXT_PUBLIC_STACK_API_URL` | URL base de la API de Hexclave | igual en los 3 | igual | igual |
| `NEXT_PUBLIC_SITE_URL` | Storefront del ambiente | prod | dev | test |
| `NEXT_PUBLIC_ADMIN_URL` | URL del admin del ambiente (links de invitación) | admin prod | admin dev | admin test |
| `NEXT_PUBLIC_FEATURE_PAGE_BUILDER` | Flag build-time Constructor | según negocio | `true` | `true` |
| `NEXT_PUBLIC_FEATURE_COLLECTIONS` | Flag build-time Colecciones | según negocio | `true` | `true` |
| `NEXT_PUBLIC_FEATURE_INVENTORY` | Flag build-time Inventario/Operaciones | según negocio | `true` | `true` |
| `PREVIEW_SIGNING_SECRET` | **HMAC** del preview. Coincide con web del ambiente | = web-prod | = web-dev | = web-test |
| `NEXT_PUBLIC_DRAFT_SECRET` | Secreto del enlace "ver borrador" del blog | propio | propio | propio |
| `STOREFRONT_BASE_DOMAIN` | Dominio base para construir el host del tenant | dominio prod | dominio dev | dominio test |

## merkiai-console (control plane / plataforma)

| Variable | Descripción | prod | dev | test |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase de **plataforma** (tenants/planes). Hoy = tienda si single-DB | propio | propio | propio |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service-role** de plataforma | propio | propio | propio |
| `ADMIN_APP_URL` | URL del admin del ambiente (server-to-server: owners/seed) | admin prod | admin dev | admin test |
| `INTERNAL_API_SECRET` | **Server-to-server**. Igual en las 3 apps del ambiente | compartido-prod | compartido-dev | compartido-test |
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | Proyecto Stack **consola** (login del operador) | propio | propio | propio |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | Client key del Stack consola | propio | propio | propio |
| `HEXCLAVE_SECRET_SERVER_KEY` | **Server key** del Stack consola | propio | propio | propio |
| `NEXT_PUBLIC_ADMIN_HEXCLAVE_PROJECT_ID` | Proyecto Stack **admin** (crea Team/dueño). = el de merkiai-admin | = admin prod | = admin dev | = admin test |
| `NEXT_PUBLIC_ADMIN_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | Client key del Stack admin | = admin | = admin | = admin |
| `ADMIN_HEXCLAVE_SECRET_SERVER_KEY` | **Server key** del Stack admin (= `HEXCLAVE_SECRET_SERVER_KEY` de merkiai-admin) | = admin prod | = admin dev | = admin test |
| `AWS_ACCESS_KEY_ID` · `AWS_SECRET_ACCESS_KEY` | **Llaves IAM** del usuario `merkiai-<env>-vault` (abren el vault). **Root of trust** — quedan en env, NO en vault | propio | propio | propio |
| `AWS_REGION` | Región de la KEK de KMS | región prod | dev | test |
| `MERKIAI_VAULT_KEY_ALIAS` | Alias de la KEK (`alias/merkiai-<env>-tenant-secrets`) | prod | dev | test |
| `PAYZEN_SHOP_ID` | Id de la tienda PayZen **propia de Merkiai** (cobro de planes · HU-440). No es la de ningún tenant | tienda prod | = prod (modo test) | = prod (modo test) |
| `PAYZEN_PASSWORD` | **Contraseña REST** de PayZen; también **firma las IPN** (`prodpassword_…` / `testpassword_…`) | prodpassword | llaves test PayZen | llaves test PayZen |
| `PAYZEN_PUBLIC_KEY` | Llave pública del formulario embebido de pago (`<shopId>:…publickey_…`) | prod | llaves test PayZen | llaves test PayZen |
| `PAYZEN_API_URL` *(opcional)* | Base de la API. Default `https://api.payzen.lat/api-payment/V4` | omitir | omitir | omitir |
| `BILLING_DUNNING_MAX_ATTEMPTS` *(opcional)* | Intentos de cobro fallidos antes de suspender (default 3) | según negocio | omitir | omitir |
| `BILLING_DUNNING_GRACE_DAYS` *(opcional)* | Días de gracia desde el primer fallo antes de suspender (default 7) | según negocio | omitir | omitir |
| `RESEND_API_KEY` | **API key de Resend** para correos de billing (activación, recibo, impago, suspensión). Sin ella no se envían (solo log) | propio | propio | omitir |
| `BILLING_EMAIL_FROM` | Remitente de esos correos (dominio verificado en Resend) | `facturacion@merkiai.com` | dominio dev | omitir |
| `CRON_SECRET` | **Secreto de Vercel Cron**: autentica el barrido diario de mora (`GET /api/internal/billing/sweep`, `Authorization: Bearer …`). Aleatorio ≥ 16 chars | propio | propio | propio |
| `HOSTING_API_TOKEN` | Token del hosting para dar de alta dominios. **Secreto → a Vault**; con **Cloudflare for SaaS (HU-431)** lo reemplaza el token de Cloudflare (también en vault) | token prod | token dev | dummy/omitir |
| `HOSTING_PROJECT_ID` · `HOSTING_TEAM_ID` | Proyecto/Team Vercel del ambiente. **→ config por celda / retiro con HU-431 (Cloudflare)** | web prod | web dev | web test |
| `HOSTING_A_RECORD` · `HOSTING_CNAME_TARGET` | Destinos DNS mostrados al comerciante. **→ Cloudflare (HU-431)** | defaults | igual | igual |
| ~~`DOMAIN_A_RECORD` / `DOMAIN_CNAME_TARGET`~~ | **Muertas** (sustituidas por `HOSTING_*`) | borrar | borrar | borrar |

## Destino de cada variable (env · Vault · retiro)

Clasificación que **congela HU-364** (y que E26/celdas completa). Hoy solo se retiran las ya-muertas; el resto evoluciona según se indica.

| Clase | Variables | Dónde viven |
|---|---|---|
| **Bootstrap / root of trust (SIEMPRE en env)** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `MERKIAI_VAULT_KEY_ALIAS`, `INTERNAL_API_SECRET` (o `PROVISIONING_API_SECRET`) | env del console (no pueden ir al vault: lo abren) |
| **Infra por-ambiente (en env; opcional respaldar en Vault)** | Supabase del control-plane (`NEXT_PUBLIC_SUPABASE_URL`+`SERVICE_ROLE_KEY`), Stack (`*HEXCLAVE*`, `NEXT_PUBLIC_STACK_API_URL`), URLs (`CONSOLE_URL` — antes `CONTROL_PLANE_URL`, alias aún aceptado —, `*_SITE_URL`, `*_ADMIN_URL`, `STOREFRONT_BASE_DOMAIN`, `NEXT_PUBLIC_ROOT_DOMAIN`), preview (`PREVIEW_SIGNING_SECRET`, `NEXT_PUBLIC_DRAFT_SECRET`), flags, `MAINTENANCE_MODE`, `TENANT_RESOLUTION_STRICT` | env por-ambiente |
| **Billing de plataforma (env del console)** | `PAYZEN_SHOP_ID`, `PAYZEN_PASSWORD`, `PAYZEN_PUBLIC_KEY`, `RESEND_API_KEY`, `BILLING_EMAIL_FROM`, `CRON_SECRET` (+ opcionales `PAYZEN_API_URL`, `BILLING_DUNNING_*`) | env del console; `PAYZEN_PASSWORD` y `RESEND_API_KEY` candidatas a vault en la separación de prod |
| **Datos de billing por tenant (nunca en env)** | Token del medio de pago del tenant (`paymentMethodToken`) | kms-vault (`subscriptions.payment_token_ref`) |
| **→ A Vault (secreto, deja de ser env plano)** | `HOSTING_API_TOKEN` (o token Cloudflare); **llaves de datos/storage por celda** (anon/service/JWT de la celda, claves S3/R2) — ya hoy por-tenant en vault | kms-vault |
| **→ A Vault por-celda con E26 (HU-430)** | De **web/admin**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, anon key, `SUPABASE_JWT_SECRET` (hoy = la celda compartida por env) → se resuelven **por celda** desde `infra_cells`+vault | kms-vault / `infra_cells` |
| **Retiro (ya no se usan)** | `DEFAULT_TENANT_ID` (opcional estricto), `DRAFT_SECRET` (web), `DOMAIN_A_RECORD`/`DOMAIN_CNAME_TARGET`; con Cloudflare: `HOSTING_PROJECT_ID`/`TEAM_ID`/`A_RECORD`/`CNAME_TARGET` | borrar |

> **Regla:** lo único que **nunca** va al vault es el bootstrap (las llaves que lo abren). Todo
> lo demás que sea secreto puede respaldarse en vault; las URLs/flags siguen como env por-ambiente.

## GitHub · Environment `test` (solo para las E2E en CI)

| Nombre | Tipo | Descripción |
|---|---|---|
| `TEST_DATABASE_URL` | Secret | URI Postgres (`postgres://…`) del Supabase de **tienda** de test |
| `PLATFORM_DATABASE_URL` | Secret | URI Postgres del Supabase de **plataforma** de test (si single-DB, = `TEST_DATABASE_URL`) |
| `E2E_INTERNAL_SECRET` | Secret | = `INTERNAL_API_SECRET` de test |
| `HEXCLAVE_SECRET_SERVER_KEY` | Secret | Server key del Stack **admin** de test (crea el usuario de prueba) |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Secret | Credenciales del admin de prueba |
| `E2E_WEB_URL` / `E2E_ADMIN_URL` / `E2E_CONSOLE_URL` | Variable | URLs del deploy de test |
| `E2E_TENANT_ID` / `E2E_TENANT_HOST` | Variable | Tenant de prueba (por defecto `00000000-0000-0000-0000-000000000001`) |
| `NEXT_PUBLIC_STACK_API_URL` / `HEXCLAVE_PROJECT_ID` / `HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | Variable | Datos del Stack admin de test para crear el usuario |

## Reglas transversales

- `INTERNAL_API_SECRET` y `PREVIEW_SIGNING_SECRET`: **idénticos entre las 3 apps del mismo ambiente**, **distintos entre ambientes**.
- El Stack **admin** es el mismo proyecto referenciado por `merkiai-admin` (`HEXCLAVE_*`) y por `merkiai-console` (`ADMIN_HEXCLAVE_*`) del mismo ambiente.
- `SUPABASE_*` de **tienda** es el mismo entre web y admin del ambiente (comparten BD); console usa el de **plataforma**.
- `TENANT_RESOLUTION_STRICT=true` en los tres → `DEFAULT_TENANT_ID` se omite.
- **Llaves PayZen de producción solo en prod.** dev/test usan las de test: una IPN de test nunca puede activar un tenant real.
- **Config fuera de env (PayZen):** en el Back Office de PayZen de cada modo, registrar la URL de notificación (IPN) `https://<console del ambiente>/api/billing/payzen/ipn`.
- **Barrido de mora:** Vercel Cron (`apps/console/vercel.json`, diario 11:00 UTC = 6:00 Colombia) llama `GET /api/internal/billing/sweep` con `CRON_SECRET`. Sin `CRON_SECRET` el cron responde 401 (fail-closed). Disparo manual: `POST` con `x-internal-secret`.

---

## Roadmap · lo que hará evolucionar esta matriz

Estado de las HU que mueven esta matriz:

- **HU-361 — Config de infra por-tenant en la consola** ✅ (tenants dedicados se configuran en la consola, no en env).
- **HU-362 — Vault AWS KMS** ✅ en código (bootstrap `AWS_*` + `MERKIAI_VAULT_KEY_ALIAS` en env del console). Pendiente operativo: verificar con un tenant dedicado real.
- **HU-363 — Orquestación de aprovisionamiento dedicado** 🔲.
- **HU-364 — Congelar env vars** 🟡: rename `CONTROL_PLANE_URL → CONSOLE_URL` y guard `env:check` hechos. Falta retirar el alias (cuando los 3 Vercel tengan `CONSOLE_URL`), mover `HOSTING_API_TOKEN` al vault y separar producción.
- **HU-440 — Billing PayZen** 🟡: variables `PAYZEN_*`, `BILLING_*`, `RESEND_API_KEY`, `CRON_SECRET` añadidas (console). Llaves pendientes de PayZen.
- **HU-431 — Cloudflare for SaaS** 🔲: retirará `HOSTING_PROJECT_ID`/`TEAM_ID`/`A_RECORD`/`CNAME_TARGET`.
- **HU-430 — Celdas** 🔲: las `SUPABASE_*` de web/admin pasarán a resolverse por celda (vault + `infra_cells`).

**Matiz importante:** incluso con HU-361/362, las variables de **infra por-ambiente**
(Supabase compartido, proyectos de Stack, `INTERNAL_API_SECRET`, URLs) **siguen existiendo**
por ambiente — lo que se mueve a consola+Vault son los **overrides de infra por tenant
dedicado**. La config de **negocio** por tenant (pagos, envíos, correo) **ya** está fuera de
env (admin → Supabase / `integration_instances`, ADR-004).

**Decisión operativa:** la separación formal del ambiente de **producción** (cuentas/llaves
definitivas) se consolida **cuando HU-361/362 estén** y el set final de variables por proyecto
y ambiente quede fijo, para no rehacer el cableado de secretos dos veces.
