-- ─────────────────────────────────────────────────────────────────────────────
-- HU-280 · Cargo adicional de envío (handling fee) sobre tarifas de transportadora
--
-- Monto fijo + porcentaje que se suman a la tarifa calculada por la transportadora
-- (p. ej. Skydropx), de forma transparente para el comprador (sin desglose).
-- No aplica a la "tarifa fija" (esa ya es el precio final que define la tienda).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.shipping_config
  add column if not exists handling_fee_fixed   integer not null default 0,
  add column if not exists handling_fee_percent  numeric(5,2) not null default 0;

comment on column public.shipping_config.handling_fee_fixed   is 'Cargo adicional fijo (COP) sobre la tarifa de transportadora. Transparente para el comprador.';
comment on column public.shipping_config.handling_fee_percent is 'Cargo adicional porcentual (%) sobre la tarifa de transportadora. Transparente para el comprador.';
