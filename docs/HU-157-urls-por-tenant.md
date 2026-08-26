# HU-157 — URLs por tenant (deprecación de NEXT_PUBLIC_SITE_URL / ADMIN_URL)

> En multi-tenant la URL deja de ser una constante de entorno: cada tenant vive en su **subdominio por defecto** o en su **dominio propio** (HU-174). `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ADMIN_URL` pasan a ser **fallback single-tenant/dev**, no la fuente de verdad.

## Fuente de verdad
`tenants.primary_domain` (dominio propio verificado, si existe) → si no, `tenants.subdomain` + `NEXT_PUBLIC_ROOT_DOMAIN`. Helpers en `apps/web/src/lib/base-url.ts`:
- `baseUrlFromRequest(req)` — deriva `${proto}://${host}` de los headers (multi-tenant por subdominio).
- `tenantBaseUrl(tenant)` — URL canónica desde el registro `tenants` (fuente segura para URLs estables).
- `resolveBaseUrl(req, tenant)` — canónica del tenant si se conoce; si no, host de la petición.

Regla de seguridad: para el **webhook/return de pagos** conviene la **canónica del tenant** (estable/verificada), no el `Host` crudo (evita spoofing). El host de la petición es fallback inmediato y correcto en single-tenant.

## Inventario de usos y estado

| Uso | Archivo | Estado |
|---|---|---|
| **Checkout: webhook + return de pagos** | `api/checkout/route.ts` (180/260/384/400) | ✅ cableado a `baseUrlFromRequest(req)` |
| Preview draft blog | `api/draft/enable/route.ts` (35) | ⏳ pasar a base por request |
| Admin: URL de webhook a copiar | `configuracion/PaymentConfigForm.tsx` (58/83/110) | ⏳ mostrar canónica del tenant |
| Admin: invitación/reset (ADMIN_URL) | `api/admin/usuarios/route.ts` (258) | ⏳ host admin del tenant/plataforma |
| Admin: previews/links blog | `blog/BlogPostForm.tsx` (293), `blog/page.tsx` (67) | ⏳ canónica del tenant |
| Newsletter: links de email | `api/admin/newsletter/send/route.ts` (114) | ⏳ canónica del tenant |
| Emails transaccionales | `lib/email.ts` (81/127/184/221) | ⏳ recibir base del tenant |
| SEO: canonical/OG/sitemap/robots/JSON-LD | `sitemap.ts`, `robots.ts`, `layout.tsx`, `shop/[slug]`, `blog/[slug]` | ⏳ canónica del tenant |

## Cambios de esquema (plataforma)
`platform/02_tenant_domains.sql`: `tenants.subdomain` + `tenants.primary_domain` (únicos por plataforma) + seed del tenant por defecto.

## Seam de resolución (implementado)
`apps/web/src/lib/tenant-context.ts`: `resolveTenant(resolver?)` lee el Host y devuelve `{ tenantId, subdomain, primaryDomain, status, plan, entitlements }`; `TenantResolver` es el contrato del origen de datos. `defaultResolver()` elige **`controlPlaneResolver`** si hay `CONTROL_PLANE_URL` + `INTERNAL_API_SECRET`, si no `singleTenantResolver` (fallback al tenant por defecto). Caché por host con **TTL 60 s**; el fallback NO se cachea (reintenta si el control plane falla).

## Núcleo cableado (HU-157 · núcleo)  ✅
`apps/web/src/lib/tenant-db.ts` → **`getRequestCatalogDb()`**: con `SUPABASE_JWT_SECRET` presente devuelve el cliente **tenant-scoped** (rol `anon` + RLS, tenant resuelto por Host); sin el secreto devuelve `undefined` → la query usa su cliente server-role (comportamiento single-tenant). **Degradación segura**: se puede desplegar y activar por configuración.

Páginas de tienda convertidas a **render dinámico por request** (decisión: dinámico por request) y con `getRequestCatalogDb()`:
- `(public)/page.tsx` (home) · `(public)/shop/page.tsx` (catálogo) · `(public)/shop/[slug]/page.tsx` (PDP).

Aislamiento real garantizado por RLS en las tablas de catálogo (`categories`, `products`, `product_variants` — `e17/02_rls_catalog.sql`). Las tablas no-catálogo (`store_config`, `home_sections`, `pages`, `blog`) aún leen sin scope por tenant → se cierran en la cola de HU-156.

**Activación en el entorno:** definir `SUPABASE_JWT_SECRET` (Legacy JWT secret), aplicar `e17/02_rls_catalog.sql`, definir `CONTROL_PLANE_URL` (=`https://merkiai.com`) + `INTERNAL_API_SECRET`, y **DNS wildcard `*.merkiai.com`** → deploy de web.

## Decisiones (resueltas)
1. **Origen del lookup host→tenant**: (a) **API interna del control plane** (`/api/internal/resolve-tenant`) — implementado en `apps/console`. ✅
2. **Renderizado**: **dinámico por request** en las páginas dependientes de tenant. ✅

## Pendiente (resto de HU-157)
1. Cablear los usos ⏳ de URLs a `tenantBaseUrl(tenant)` / `resolveBaseUrl(req, tenant)` (SEO, emails, PaymentConfigForm, usuarios/ADMIN_URL).
2. Tenant-scope de los singletons no-catálogo (`store_config`, `home_sections`, `pages`, `blog`) vía RLS (cola de HU-156).

## Nota sobre webhooks de pago
Las credenciales de pasarela son **por tenant** (`payment_config` tenant-scoped) y la URL de webhook se registra por comercio. Con resolución por host, `https://<tenant-host>/api/webhooks/<provider>` resuelve el tenant correcto; el handler ya re-consulta la pasarela y verifica firma + idempotencia + monto.
