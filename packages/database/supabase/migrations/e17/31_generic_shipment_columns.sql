-- ─────────────────────────────────────────────────────────────────────────────
-- HU-282 · Columnas de envío AGNÓSTICAS al proveedor
--
-- Prepara la integración de otras transportadoras además de Skydropx. En vez de
-- `orders.skydropx_shipment_id`, se usan columnas genéricas:
--   shipment_provider     → slug del proveedor que generó la guía ('skydropx', …)
--   shipment_external_id  → id del envío en ese proveedor (= skydropx_shipment_id)
--
-- Las columnas `skydropx_*` se conservan (compatibilidad); el código escribe
-- ambas y los webhooks emparejan por la genérica con fallback a la legacy.
-- Idempotente. Aplicar en el plano de TIENDA.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists shipment_provider    text,
  add column if not exists shipment_external_id text;

-- Backfill desde la columna específica de Skydropx.
update public.orders
   set shipment_provider = 'skydropx',
       shipment_external_id = skydropx_shipment_id
 where skydropx_shipment_id is not null
   and shipment_external_id is null;

create index if not exists orders_shipment_external_idx
  on public.orders (shipment_external_id)
  where shipment_external_id is not null;

comment on column public.orders.shipment_provider    is 'Slug del proveedor de envío que generó la guía (agnóstico). Ej: skydropx.';
comment on column public.orders.shipment_external_id is 'Id del envío en el proveedor (agnóstico). Reemplaza a skydropx_shipment_id.';
