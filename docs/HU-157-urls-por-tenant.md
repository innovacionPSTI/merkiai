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
`apps/web/src/lib/tenant-context.ts`: `resolveTenant(resolver?)` lee el Host de la petición y devuelve `{ tenantId, subdomain, primaryDomain }`; `TenantResolver` es el contrato del origen de datos; `singleTenantResolver` (interim) devuelve el tenant por defecto. `apps/web/src/lib/tenant-db.ts` gana `getRequestTenantDb()` (resuelve + construye el cliente). **Comportamiento actual sin cambios** (resuelve al tenant por defecto); las páginas aún NO usan `getRequestTenantDb` para no romper ISR.

## Decisiones abiertas (a resolver al activar multi-host real)
1. **Origen del lookup host→tenant** (el registro `tenants` vive en la BD de plataforma, solo control plane):
   - (a) **API interna de resolución del control plane** — recomendado; requiere el `apps/console` (o un endpoint mínimo de resolución).
   - (b) **Path de lectura acotado** a `tenants` desde el plano de tienda (rompe el límite service-role; requiere policy/rol de solo-lectura).
2. **Renderizado**: leer el Host vuelve la página **dinámica** (rompe ISR/`revalidate`). Decidir por página (dinámico puro vs caché por host) al activar la resolución.

## Pendiente (resto de HU-157)
1. Elegir origen del lookup (decisión #1) e implementar el `TenantResolver` real.
2. Cambiar las páginas a `getRequestTenantDb()` (decisión #2 de renderizado).
3. Cablear los usos ⏳ de URLs a `tenantBaseUrl(tenant)` / `resolveBaseUrl(req, tenant)` (SEO, emails, PaymentConfigForm, usuarios/ADMIN_URL).

## Nota sobre webhooks de pago
Las credenciales de pasarela son **por tenant** (`payment_config` tenant-scoped) y la URL de webhook se registra por comercio. Con resolución por host, `https://<tenant-host>/api/webhooks/<provider>` resuelve el tenant correcto; el handler ya re-consulta la pasarela y verifica firma + idempotencia + monto.
