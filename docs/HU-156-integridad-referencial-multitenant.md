# HU-156 — Integridad referencial en multi-tenant: análisis y correcciones

> Análisis del modelo de datos desde el objetivo SaaS multi-tenant. Conclusión: que varias tablas estén "aisladas" (sin FK) **no es una falla**; son config, catálogos, logs o snapshots intencionalmente desacoplados. Las fallas estructurales reales son **dos patrones transversales** que el multi-tenant expone y que hoy no están resueltos.

## ¿Es correcto que estén "solas"?

Sí, para estos casos el aislamiento es correcto y deliberado:

- **Config singleton** (`store_config`, `payment_config`, `shipping_config`, `admin_config`): configuración global; no referencian nada. En multi-tenant pasan a **una fila por tenant** (keyed por `tenant_id`).
- **Catálogos/plantillas** (`themes`, `variant_types`): plantillas reutilizables; se referencian por valor (JSONB), no por FK. Correcto.
- **Snapshots inmutables** (`coupons` vía `orders.coupon_code`, `orders.items`): copias congeladas para preservar el pedido aunque cambie el catálogo. **No deben** tener FK. Correcto.
- **Logs/idempotencia** (`processed_webhook_events`): registro global; standalone correcto.
- **Marketing** (`newsletter_subscribers`) y `shipping_profiles`: desacoplados a propósito (este último con deuda HU-191, solapa `customer_addresses`).

`profiles`, `media_assets` y `blog_posts` **sí** tienen FK (`author_id`/`uploaded_by → profiles`); no están realmente aisladas.

## Falla estructural #1 (la más urgente) — UNIQUE global en claves de negocio

Todas estas restricciones son **UNIQUE globales**, lo que **impide que dos tenants tengan el mismo valor**:

| Tabla | Clave hoy (global) | Debe ser |
|---|---|---|
| `products` | `slug` | `UNIQUE (tenant_id, slug)` |
| `categories` | `name`, `slug` | `UNIQUE (tenant_id, slug)` |
| `product_variants` | `sku` | `UNIQUE (tenant_id, sku)` |
| `coupons` | `code` | `UNIQUE (tenant_id, code)` |
| `blog_posts` | `slug` | `UNIQUE (tenant_id, slug)` |
| `pages` | `key` (PK), `slug` | `UNIQUE (tenant_id, key)` y `(tenant_id, slug)` |
| `nav_items` | `nav_key` | `UNIQUE (tenant_id, nav_key)` |
| `page_sections` | `section_key` | `UNIQUE (tenant_id, section_key)` |
| `media_assets` | `key` (PK) | `UNIQUE (tenant_id, key)` |
| `customers` | `email`, `stack_id` | `UNIQUE (tenant_id, email)` y `(tenant_id, stack_id)` |
| `profiles` | `email` | `UNIQUE (tenant_id, email)` |
| `newsletter_subscribers` | `email` | `UNIQUE (tenant_id, email)` |
| `shipping_profiles` | `email` | `UNIQUE (tenant_id, email)` |
| `orders` | `order_number` | `UNIQUE (tenant_id, order_number)` |

Sin esto, el tenant B **no puede** tener un producto con slug `cafe-huila`, ni un cliente con un email que ya exista en el tenant A, ni una página `home`. **Es bloqueante para el multi-tenant real.**

Excepción: `cart_items UNIQUE (customer_id, variant_id)` ya está acotada por `customer_id` (tenant-scoped) → OK.

## Falla estructural #2 — FKs sin `tenant_id` (fuga referencial cross-tenant)

Las FK actuales referencian solo el `id`/`key` del padre, no `(id, tenant_id)`:

`products.category_id→categories` · `product_variants.product_id→products` · `orders.customer_id→customers` · `cart_items.{customer_id,variant_id,product_id}` · `customer_addresses.customer_id→customers` · `nav_items.{page_key,parent_id}` · `page_sections.page_key→pages` · `section_items.section_id→page_sections` · `media_assets.uploaded_by→profiles` · `blog_posts.author_id→profiles`

Riesgo: **un hijo del tenant A podría referenciar un padre del tenant B** (la FK solo valida existencia, no coincidencia de tenant). La RLS oculta filas pero **no** valida integridad de FK (se comprueba con privilegios elevados). Resultado: referencias cruzadas inconsistentes.

**Corrección:** FK **compuestas** que incluyan `tenant_id`, respaldadas por un **UNIQUE compuesto en el padre**:

```sql
-- Padre expone (id, tenant_id) como clave referenciable
alter table categories add constraint categories_id_tenant_uk unique (id, tenant_id);
-- Hijo referencia el par → garantiza mismo tenant
alter table products drop constraint products_category_id_fkey;
alter table products add constraint products_category_fk
  foreign key (category_id, tenant_id) references categories (id, tenant_id) on delete set null;
```

## Falla estructural #3 (aceptada, documentada) — `tenant_id` sin FK

`tenant_id` **no** referencia una tabla `tenants` porque el registro autoritativo vive en **otro proyecto Supabase** (BD de plataforma) → no hay FK cross-proyecto. Es un trade-off **deliberado** (ver ADR-001). Mitigación: el control plane garantiza la existencia del tenant al provisionar, la RLS protege el acceso, y se corre un **chequeo de integridad periódico** (tenant_id huérfanos). Si algún día registro y datos vivieran en el mismo proyecto, se añadiría la FK.

## Plan de corrección (orden sugerido, en staging primero)

1. **UNIQUE por tenant** (falla #1) — reemplazar los UNIQUE globales por `(tenant_id, <clave>)`. Es lo más urgente y desbloquea el alta de un segundo tenant. Va junto con la conversión de singletons a fila-por-tenant.
2. **Claves compuestas + FK compuestas** (falla #2) — añadir `UNIQUE (id, tenant_id)` en padres y cambiar las FK de hijos a la forma compuesta. Migración cuidadosa (drop/add constraint), en un archivo `e17/03_composite_keys.sql`.
3. **Chequeo de integridad** (falla #3) — job/consulta que detecte `tenant_id` sin tenant en el registro y FKs cross-tenant residuales.

## Regla para TODA tabla futura (tenant-scoped)

- **`tenant_id uuid NOT NULL`** siempre.
- Toda **UNIQUE de negocio** se declara como **`UNIQUE (tenant_id, <clave>)`**, nunca global.
- Toda **FK a otra tabla tenant-scoped** es **compuesta incluyendo `tenant_id`**; el padre expone `UNIQUE (id, tenant_id)`.
- **Política RLS** `... USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)` (+ `WITH CHECK` en escritura).
- **Config/singletons**: una fila por tenant, `UNIQUE (tenant_id)`; sin `CHECK (id = 1)`.
- **Snapshots inmutables** (copias congeladas en `orders`, etc.): **sin FK**, a propósito — documentarlo.
- **Índice** en `tenant_id` (y en `(tenant_id, <clave de filtro frecuente>)`).
- Tablas **globales de plataforma** (viven en la BD de plataforma) **no** llevan `tenant_id`.

> Estas reglas ya están reflejadas en `INSTRUCCIONES_PROYECTO.md` (§Convenciones). El detalle de corrección es tech-debt de **HU-156** y debe ejecutarse **antes** de dar de alta un segundo tenant real.
