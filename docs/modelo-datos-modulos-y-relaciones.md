# Modelo de datos — Módulos, relaciones y guía para tablas futuras

> Mapa del modelo por **módulos (bounded contexts)**, comparado con un MER de CMS/commerce bien estructurado. Objetivo: (1) mostrar qué **tablas futuras** conectarán las tablas hoy "sueltas", y (2) fijar el **proceso obligatorio** de revisión al crear cualquier tabla nueva de las HU faltantes.
>
> Complementa: `docs/HU-156-integridad-referencial-multitenant.md` (integridad técnica y conceptual) y `INSTRUCCIONES_PROYECTO.md` (reglas de datos multi-tenant). Alinea con HU-195 (propiedad de datos por dominio).

## Principio rector

Distinguir tres tipos de tabla y su regla de relación:

- **Operativa / de referencia** → **debe** tener FK a su dueño (catálogo, contenido, pedidos).
- **Snapshot inmutable** (copia congelada en el pedido) → **sin** FK, a propósito.
- **Config / plantilla / log / marketing** → independiente; se vincula solo si aparece un **módulo** que lo requiera (ver abajo).

Una tabla "suelta" no es un error: puede estar esperando el **módulo** que la integre. Este documento predefine esos módulos.

## Módulos actuales y sus relaciones

| Módulo | Tablas actuales | Estado de relaciones |
|---|---|---|
| **Identidad** | `profiles`, `customers` | OK (referenciadas por contenido/pedidos) |
| **Catálogo** | `categories` ← `products` ← `product_variants`; `variant_types` (plantilla) | FK correctas; `variant_types` por valor (JSONB) |
| **Contenido/CMS** | `pages` ← `page_sections` ← `section_items`; `nav_items`; `blog_posts` | Cadena de FK correcta |
| **Medios** | `media_assets` | FK a `profiles`; uso (`used_in`) por JSONB |
| **Pedidos** | `orders` → `customers`; `cart_items`; (`orders.items`/`coupon_code`/`shipping_addr` = snapshots) | OK; falta `order_items` (ver módulo Reporting) |
| **Promociones** | `coupons` | Snapshot en `orders`; sin join de redención aún |
| **Apariencia** | `themes` + campos en `store_config` (logo, favicon, colores) + `section_settings` | **Disperso** → candidato a módulo `store_design` |
| **Configuración** | `store_config`, `payment_config`, `shipping_config`, `admin_config` | Singletons → fila por tenant (E17) |
| **Envíos** | `shipping_config`, `shipping_profiles` | `shipping_profiles` solapa `customer_addresses` (HU-191) |
| **Marketing** | `newsletter_subscribers` | Independiente; sin enlace a `customers` |
| **Plataforma/Ops** | `processed_webhook_events` | Log global (correcto) |

## Tablas futuras que vincularán las tablas hoy "sueltas"

Predefinidas por módulo. Al implementar la HU correspondiente, **estas tablas dan la relación que hoy falta**.

### Módulo `store_design` (apariencia) — HU-121/122/128/129
Unifica la apariencia hoy dispersa entre `themes` y campos de `store_config`.

- **`store_design`** (1 por tenant) → `active_theme_id` **FK → themes**; layout/branding activo. Vincula *apariencia ↔ tema*.
- **`templates`** / **`layout_variants`** (navbar/home/PDP/carrito) → **FK → themes** o a `store_design`; variantes de disposición.
- Resultado: `themes` deja de estar "suelto"; la apariencia queda como módulo con dueño claro.

### Módulo Reporting / analítica de ventas — habilita IA (E16)
- **`order_items`** → **FK → orders** (`ON DELETE CASCADE`) + `product_id` snapshot (nullable **FK → products** `SET NULL`), `qty`, `unit_price`, atributos. Da la relación **orders ↔ products** para "más vendidos", clustering y KPIs (hoy `getBestSellingProducts` apunta a una tabla inexistente).

### Módulo Promociones — HU-147
- **`promotions`** (reglas) y **`coupon_redemptions`** → **FK → coupons**, **FK → orders**, **FK → customers**. Da uso/límites por cliente **sin** tocar el snapshot del pedido.

### Módulo Pagos (normalización) — E6
- **`payment_transactions`** → **FK → orders**; historial de intentos/estados por pasarela (hoy inline en columnas `tucompra_*`/`bold_*` de `orders`). Vincula *pedido ↔ transacciones*.

### Módulo Reseñas / Wishlist — HU-101/104
- **`product_reviews`** → **FK → products**, **FK → customers**.
- **`wishlists`** / **`wishlist_items`** → **FK → customers**, **FK → product_variants**. Vinculan *cliente ↔ catálogo*.

### Módulo Medios (integridad de uso) — E13
- **`media_usage`** (o join explícitos `product_media`, `page_media`) → **FK → media_assets** + entidad usuaria. Reemplaza el `used_in` JSONB si se quiere impedir borrar medios en uso.

### Módulo Inventario multi-ubicación — E18
- **`locations`**, **`inventory_levels`** → **FK → product_variants**, **FK → locations**. Stock por `(variante, ubicación)`.

### Módulo Marketing (enlace de consentimiento) — E8
- Enlazar **`newsletter_subscribers.customer_id`** (nullable **FK → customers**) para unir suscriptor ↔ cuenta.
- **`email_templates`**, **`email_log`**, **`suppression_list`** (HU-160/161/162).

### Módulo Contenido (versionado / SEO) — HU-127/113
- **`content_versions`** → **FK → pages**/`page_sections`; historial.
- **`redirects`** → relación con `pages` (301).

### Módulo Plataforma (control plane, BD de plataforma) — E17
- **`tenants`**, **`plans`**, **`subscriptions`**, **`domains`**, **`audit_log`**. Viven en la **BD de plataforma** (no llevan `tenant_id`; ver ADR-001).

## Proceso OBLIGATORIO al crear una tabla nueva (HU faltantes)

Antes de crear cualquier tabla, responder en la HU/PR:

1. **¿A qué módulo pertenece?** (usar el mapa de arriba; si es nuevo, nombrarlo).
2. **¿Se relaciona con una tabla existente?**
   - **Sí, operativa/referencia** → crear **FK** (compuesta con `tenant_id`, ver reglas E17). Revisar si además debe existir una **tabla-puente** de este documento.
   - **Sí, pero es copia inmutable** (dato del pedido) → **snapshot sin FK**; documentarlo.
   - **No** → independiente; justificar por qué (config/plantilla/log/marketing) y anotarlo.
3. **Reglas multi-tenant** (siempre): `tenant_id NOT NULL` + índice; `UNIQUE (tenant_id, <clave>)`; FK **compuestas** con `tenant_id`; política RLS por claim; singletons por tenant. (Detalle en `INSTRUCCIONES_PROYECTO.md`.)
4. **¿Consolida una tabla suelta?** Si la nueva tabla es el "módulo" que integra una existente (p. ej. `store_design`→`themes`), migrar la relación y actualizar este documento.
5. **Actualizar** este mapa y el diagrama del modelo.

> Regla de bolsillo: **ninguna tabla nueva se crea sin pasar este checklist.** Si queda "suelta", debe estar justificado explícitamente en la HU.
