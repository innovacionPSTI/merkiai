# Migraciones — guía compacta

El esquema se despliega con **2 archivos** (más los seeds). Los antiguos archivos numerados (`1_*` … `29_*`) se **eliminaron**: eran redundantes porque todo su contenido ya está consolidado en `01_schema.sql` (y en `upgrade.sql` para actualizaciones).

```
migrations/
├── 01_schema.sql   ← esquema canónico completo (única fuente de verdad)
├── upgrade.sql     ← parche idempotente para BD existentes
└── README.md
```

## Despliegue NUEVO (desde cero)

Ejecuta en el SQL Editor de Supabase, en orden:

1. `01_schema.sql` — **esquema canónico completo**: 24 tablas (con FKs, constraints, índices), triggers, funciones RPC (`generate_order_number`, `decrement_variant_stock`, `restore_variant_stock`), RLS habilitado en **todas** las tablas y políticas públicas.
2. `../seeds/01_config.sql` — tema por defecto, tipos de variante, categorías, navegación base.
3. `../seeds/02_content.sql` — páginas, secciones e ítems del CMS.

## BD EXISTENTE (actualizar una instalación previa)

Ejecuta **solo**:

- `upgrade.sql` — parche **idempotente** consolidado. Es seguro re-ejecutarlo. Lleva una BD previa hasta el estado actual: favicon, `admin_config`, proveedores de email/envío, `active_provider` + Bold, inventario (stock/backorder), número de orden (secuencia + prefijo), **Tu Compra REST/integrador** (seguimiento de transacción + llave de firma), **endurecimiento de webhooks** (`processed_webhook_events` + `mercadopago_webhook_secret`) y la habilitación de RLS que faltaba en `admin_config` y `processed_webhook_events`.

## Coherencia del modelo

- **RLS en todas las tablas** (24/24). Las tablas solo-`service_role` (config singletons, `admin_config`, `processed_webhook_events`) tienen RLS habilitado sin política pública → deniegan a `anon`/`authenticated`; el `service_role` omite RLS.
- **Sin tablas huérfanas problemáticas.** Las tablas sin FK son intencionales: config singletons (`store_config`, `payment_config`, `shipping_config`, `admin_config`), catálogos/logs (`themes`, `variant_types`, `newsletter_subscribers`, `processed_webhook_events`) y snapshots (`orders.items`/`orders.coupon_code` son copias inmutables, no FKs, para preservar el pedido si cambia el catálogo o el cupón).
- **Nota de deuda técnica (HU-191):** `shipping_profiles` (perfil de envío por email) se solapa con `customer_addresses` (direcciones por `customer_id`). Ambas están en uso; la consolidación en una fuente única está redactada como **HU-191** en `PRODUCT_BACKLOG.md` (no se toca aquí para no romper el feature vivo `/api/shipping-profile`).

## Multi-tenant (E17 · roadmap)

Artefactos de la migración a multi-tenant (aplicar sobre `upgrade.sql`/`01_schema.sql` ya vigentes). **Aplicar primero en staging.**

- `e17/01_tenant_id.sql` — **paso 1 (no disruptivo):** añade `tenant_id` (NOT NULL, DEFAULT = tenant por defecto `00000000-0000-0000-0000-000000000001`) a las 19 tablas tenant-scoped + índices, y a los 4 config singleton (conservando `CHECK id=1` por ahora); `processed_webhook_events` lo lleva nullable. La app single-tenant sigue funcionando (service-role + default). **No** toca RLS ni convierte singletons — eso viene tras cablear `@merkiai/tenancy`.
- `e17/02_rls_catalog.sql` — RLS anon/authenticated por `tenant_id` en catálogo (`categories`/`products`/`product_variants`).
- `e17/03_unique_por_tenant.sql` — UNIQUE globales → `(tenant_id, clave)` (desbloquea el 2º tenant) + singletons relajados a `UNIQUE(tenant_id)`.
- `e17/04_fk_compuestas.sql` — `UNIQUE(id, tenant_id)` + FKs compuestas `(col, tenant_id)` (evita fuga referencial cross-tenant).
- `e17/05_rls_session_flows.sql` — RLS `authenticated` de datos propios del comprador (`customers`/`customer_addresses`/`cart_items` + `orders` SELECT).
- `e17/06_rls_content.sql` — RLS anon/authenticated por tenant en contenido (`pages`/`page_sections`/`section_items`/`blog_posts`/`nav_items`).
- `e17/07_config_por_tenant.sql` — `UNIQUE(tenant_id)` en los 4 config; `store_config` lectura anon por tenant; `payment/admin/shipping_config` RLS sin política (solo service-role).
- `e17/08_rls_themes.sql` — **RLS anon-tenant de `themes`** (apariencia por tenant en el storefront; sin ella la tienda no lee su tema por RLS).
- `../platform/01_platform_schema.sql` — **BD de PLATAFORMA** (proyecto Supabase **distinto**, control plane): tabla `tenants` (`status`, `plan`, `data_isolation`, `db_ref`, `stack_team_id`) con RLS solo-service-role + seed del tenant por defecto (mismo UUID que arriba).
- `../platform/02_tenant_domains.sql` — `subdomain`/`primary_domain` en `tenants` (resolución host→tenant).
- `../platform/03_plans.sql` — catálogo `plans` (features/limits) + FK `tenants.plan`.

Estado del cableado (E17): catálogo, contenido, config y **storefront** (tema/nav/marca/home) ya sirven por tenant vía cliente RLS (HU-156/157/207). **Pendiente:** admin tenant-scoped con cliente RLS (HU-158) y config-por-tenant en webhooks/reconcile (HU-216). Ver `docs/HU-216-service-role-audit.md`, `docs/HU-156-service-role-mapping.md` y `docs/adr/ADR-001-auth-rls-multitenant.md`.
