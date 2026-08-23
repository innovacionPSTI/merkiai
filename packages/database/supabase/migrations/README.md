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
