-- =============================================================================
-- E28 · HU-468 — Localización regional de direcciones, teléfonos y documentos
-- =============================================================================
-- · customer_addresses: país (ISO 3166-1 alfa-2, default CO = comportamiento
--   histórico), barrio/colonia y el teléfono normalizado en E.164.
-- · customers: tipo de documento (CC, CE, NIT, PP, RFC, CURP, NIF, NIE) junto al
--   número existente `document_id` (E27).
-- · orders.shipping_addr (JSONB) incorpora `country`/`neighborhood`/`phone_e164`
--   en el snapshot sin cambio de esquema.
-- Las direcciones colombianas existentes se leen sin migrar datos (AC-5).
-- Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

alter table public.customer_addresses add column if not exists country text not null default 'CO';
alter table public.customer_addresses add column if not exists neighborhood text;
alter table public.customer_addresses add column if not exists phone_e164 text;

do $$ begin
  alter table public.customer_addresses
    add constraint customer_addresses_country_iso check (country ~ '^[A-Z]{2}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.customer_addresses
    add constraint customer_addresses_phone_e164 check (phone_e164 is null or phone_e164 ~ '^\+[1-9]\d{6,14}$');
exception when duplicate_object then null; end $$;

alter table public.customers add column if not exists document_type text;

do $$ begin
  alter table public.customers
    add constraint customers_document_type_known
    check (document_type is null or document_type in ('CC', 'CE', 'NIT', 'PP', 'RFC', 'CURP', 'NIF', 'NIE'));
exception when duplicate_object then null; end $$;

comment on column public.customer_addresses.country is 'E28 · HU-468: país de la dirección (ISO alfa-2). Default CO.';
comment on column public.customer_addresses.phone_e164 is 'E28 · HU-468: teléfono normalizado (+<código><número>).';
comment on column public.customers.document_type is 'E28 · HU-468: tipo de documento según el país (CC, CE, NIT, PP, RFC, CURP, NIF, NIE).';

-- Rollback (staging):
--   alter table public.customer_addresses drop column if exists country, drop column if exists neighborhood, drop column if exists phone_e164;
--   alter table public.customers drop column if exists document_type;
