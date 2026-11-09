# Matriz de variables de entorno por proyecto y ambiente — Merkiai

> **Estado: PROVISIONAL.** Esta matriz refleja el modelo actual (variables de infra
> por **ambiente** en Vercel). Está pendiente de consolidarse cuando aterricen
> **HU-361** (config de infra por-tenant en la consola: env → config), **HU-362**
> (custodia cifrada de secretos / **Vault**) y **HU-363** (orquestación), más el
> posible **renombre `CONTROL_PLANE` → `CONSOLE`**. Hasta entonces, úsese como
> checklist; no es el set definitivo (ver §Roadmap al final).

## Leyenda

- **propio** — recurso propio y aislado de ese ambiente (su Supabase / su Stack).
- **= web / = admin** — mismo valor que esa app en el **mismo** ambiente.
- **compartido-<amb>** — mismo valor entre las 3 apps del **mismo** ambiente, distinto entre ambientes.
- **igual en los 3** — mismo valor en los tres ambientes.
- **omitir** — no cargar la variable.
- Secretos en **negrita** en la descripción.

---

## merkiai-web (storefront)

| Variable | Descripción | prod | dev | test |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase de tienda | propio | propio | propio |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key de ese Supabase | propio | propio | propio |
| `SUPABASE_JWT_SECRET` | **JWT secret** que firma el claim `tenant_id` (RLS). Crítico | propio | propio | propio |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service-role** (omite RLS); solo islas sin sesión | propio | propio | propio |
| `CONTROL_PLANE_URL` | URL de la consola (resuelve host→tenant) | console prod | console dev | console test |
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
| `CONTROL_PLANE_URL` | URL de la consola del ambiente | console prod | console dev | console test |
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
| `HOSTING_API_TOKEN` | **Token** del hosting (Vercel) para dar de alta dominios de tenants. **Secreto → a Vault (HU-362)**, por-entorno | token prod | token dev | dummy/omitir |
| `HOSTING_PROJECT_ID` | Id/nombre del proyecto web en Vercel del ambiente | web prod | web dev | web test |
| `HOSTING_TEAM_ID` | Team de Vercel dueño del proyecto web | team prod | team dev | team test/omitir |
| `HOSTING_A_RECORD` | Destino DNS tipo A mostrado al comerciante | `76.76.21.21` | igual | igual |
| `HOSTING_CNAME_TARGET` | Destino DNS CNAME | `cname.vercel-dns.com` | igual | igual |
| ~~`DOMAIN_A_RECORD` / `DOMAIN_CNAME_TARGET`~~ | **Muertas** (sustituidas por `HOSTING_*`) | borrar | borrar | borrar |

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

---

## Roadmap · lo que hará evolucionar esta matriz

Esta matriz es **provisional** porque parte de la configuración de infra/secretos migrará
de env global a **gestión desde la consola + Vault**. HU relevantes (todas 🔲 roadmap):

- **HU-361 — Config de infra por-tenant en la consola (env → config).** Mueve a la BD de
  plataforma + UI de consola las variables de infra de **tenants dedicados** (endpoint/claves
  de su BD, `JWT_SECRET` de esa instancia, DSN de Sentry, base URL), resueltas por el
  connection factory. No elimina las variables **por-ambiente** del clúster compartido.
- **HU-362 — Custodia cifrada de secretos (Vault/KMS).** Cifrado en reposo, descifrado
  server-side con mínimo privilegio y rotación por-tenant. Extiende HU-206/228.
- **HU-363 — Orquestación de aprovisionamiento dedicado** (compone HU-200 + 361 + 362).
- **Renombre `CONTROL_PLANE_URL` → `CONSOLE_URL`** (nomenclatura; pendiente de decidir).

**Matiz importante:** incluso con HU-361/362, las variables de **infra por-ambiente**
(Supabase compartido, proyectos de Stack, `INTERNAL_API_SECRET`, URLs) **siguen existiendo**
por ambiente — lo que se mueve a consola+Vault son los **overrides de infra por tenant
dedicado**. La config de **negocio** por tenant (pagos, envíos, correo) **ya** está fuera de
env (admin → Supabase / `integration_instances`, ADR-004).

**Decisión operativa:** la separación formal del ambiente de **producción** (cuentas/llaves
definitivas) se consolida **cuando HU-361/362 estén** y el set final de variables por proyecto
y ambiente quede fijo, para no rehacer el cableado de secretos dos veces.
