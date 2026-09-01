# HU-228 · Custodia y rotación de secretos

> Compuerta de go-live (Fase A). Los secretos —no el código— son el punto único de compromiso total del aislamiento multi-tenant. Este documento define qué secreto hace qué, quién lo custodia y cómo se rota.

## 1. Inventario de secretos críticos

| Secreto | Qué habilita | Riesgo si se filtra | Alcance |
|---|---|---|---|
| **`SUPABASE_JWT_SECRET`** (Legacy JWT secret) | Firma/verifica los JWT de tenant (`mintTenantJwt`): claims `tenant_id`, `role`, `is_admin`. | **Suplantación total de cualquier tenant** (firmar `tenant_id`+`is_admin` arbitrarios → leer/escribir cualquier tienda, saltando RLS). | web + admin (firman) · Supabase (verifica). **Es la joya de la corona.** |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Cliente service-role (omite RLS). | Acceso total a la BD sin RLS. | Solo islas server-side (webhooks/upload/owners) — en reducción por HU-227. |
| **`INTERNAL_API_SECRET`** | Auth server-to-server de `/api/internal/*` (crear owners/super_admin, resolver tenant). | **Escalada:** crear `super_admin` de cualquier tenant. | Hoy **compartido** por las 3 apps → un leak compromete el aprovisionamiento. |
| Claves de pasarelas (`payment_config.*`) | Cobrar/verificar webhooks. | Fraude de pagos por tenant. | Por tenant, en BD (nunca anon-readable). |
| `resend_api_key`, Skydropx OAuth | Email / envíos. | Envío no autorizado. | Por tenant, en BD. |

## 2. Reglas de custodia

- **Nunca en el repo.** Solo en el gestor de secretos del entorno (Vercel Environment Variables / gestor del hosting). `.env.local` es local y no se commitea; `.env.example` solo lista **nombres**, nunca valores.
- **`SUPABASE_JWT_SECRET` con el mínimo de lectores.** Hoy lo leen web y admin (para firmar). No debe estar en la consola ni en clientes. Verificado en código: se lee solo en `mintTenantJwt` (server) vía `getAdminDb`/`getMachineDb`/`getRequestCatalogDb`, todos fail-closed (lanzan si falta; no degradan a service-role).
- **`INTERNAL_API_SECRET` ≥ 24 caracteres** (el guard `withInternalAuth` rechaza fail-closed si es más corto), aleatorio, comparación timing-safe.
- **Separar el secreto interno por app (pendiente).** Hoy es uno compartido. Objetivo: un secreto de aprovisionamiento **dedicado consola↔admin** (`PROVISIONING_API_SECRET`) distinto del de resolución de tenant, para que un leak de uno no habilite crear owners. Además, allowlist de red / URL privada consola↔admin.

## 3. Procedimiento de rotación

**`SUPABASE_JWT_SECRET`** (rotación coordinada — invalida todos los JWT de tenant en vuelo):
1. Generar el nuevo secreto en Supabase (Legacy JWT settings).
2. Actualizar la env var en **web y admin** simultáneamente y redeploy.
3. Los JWT se firman por request (TTL 1h), así que tras el redeploy todo usa el nuevo secreto. No hay sesiones de usuario atadas al secreto (Stack Auth es aparte).
4. Verificar: una lectura de catálogo (anon+tenant) y una acción de admin (is_admin) siguen funcionando.

**`INTERNAL_API_SECRET` / `PROVISIONING_API_SECRET`:**
1. Generar nuevo (≥24 chars).
2. Actualizar en las apps que lo consumen (consola + admin) a la vez; redeploy.
3. Probar `POST /api/internal/owners` (crear owner de un tenant de prueba) → 200.

**Claves de pasarela / Resend / Skydropx (por tenant):** se rotan desde el admin de cada tienda (config por tenant); no requieren redeploy.

## 4. Cadencia y monitoreo

- Rotar `SUPABASE_JWT_SECRET` e `INTERNAL_API_SECRET` **al menos cada 90 días** y **de inmediato** ante sospecha de filtración o salida de un miembro con acceso.
- El guard interno ya loguea intentos 401/429/500 (visibilidad de fuerza bruta). Añadir alerta cuando esos superen un umbral (enlaza HU-170 APM / HU-146 auditoría).

## 5. Estado

- ✅ Fail-closed en el uso de `SUPABASE_JWT_SECRET` (todos los clientes RLS lanzan si falta).
- ✅ `withInternalAuth` fail-closed (secreto ≥24, timing-safe, rate-limit, logging).
- 🔲 **Pendiente:** separar `PROVISIONING_API_SECRET` por app; allowlist de red consola↔admin; alerta sobre 401/429 del endpoint interno.
