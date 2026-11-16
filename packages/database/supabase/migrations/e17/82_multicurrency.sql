-- =============================================================================
-- E28 · HU-467 — Multimoneda por mercado
-- =============================================================================
-- Precio local por mercado (lista de precios en su moneda o tasa fija +
-- redondeo), impuesto por país, moneda fija en el pedido y valor almacenado
-- (cupones de monto fijo, gift cards) en su moneda.
-- Aditiva e idempotente. Sin datos nuevos todo se comporta como hoy: mercados
-- en la moneda base, sin impuesto discriminado, pedidos en COP.
-- Plano de TIENDA.
-- =============================================================================

-- ── Mercados: tasa, redondeo e impuesto ──────────────────────────────────────
alter table public.markets add column if not exists fx_rate numeric(18,6);
alter table public.markets add column if not exists price_rounding text not null default 'auto';
alter table public.markets add column if not exists tax_rate numeric(5,2) not null default 0;
alter table public.markets add column if not exists tax_included boolean not null default true;

do $$ begin
  alter table public.markets add constraint markets_price_rounding_chk
    check (price_rounding in ('auto','none','integer','nearest_10','nearest_100','nearest_1000','x99','x90'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.markets add constraint markets_fx_rate_chk check (fx_rate is null or fx_rate > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.markets add constraint markets_tax_rate_chk check (tax_rate >= 0 and tax_rate <= 50);
exception when duplicate_object then null; end $$;

comment on column public.markets.fx_rate is 'HU-467: 1 unidad de la moneda base = fx_rate unidades de la moneda del mercado (NULL = sin conversión).';
comment on column public.markets.price_rounding is 'HU-467: redondeo del precio convertido (auto, none, integer, nearest_10/100/1000, x99, x90).';
comment on column public.markets.tax_rate is 'HU-467: impuesto del país en % (0 = no se discrimina).';
comment on column public.markets.tax_included is 'HU-467: true = los precios incluyen el impuesto; false = se suma en el checkout.';

-- ── Listas de precio en una moneda ───────────────────────────────────────────
alter table public.price_lists add column if not exists currency text;
comment on column public.price_lists.currency is 'HU-467: moneda de los precios de la lista (NULL = moneda base de la tienda).';

-- ── Pedidos: moneda fija, impuesto y tasa usada ──────────────────────────────
alter table public.orders add column if not exists currency text not null default 'COP';
alter table public.orders add column if not exists tax_amount numeric(14,2) not null default 0;
alter table public.orders add column if not exists fx_rate numeric(18,6);
alter table public.orders add column if not exists market_key text;
create index if not exists orders_tenant_currency_idx on public.orders (tenant_id, currency);
comment on column public.orders.currency is 'HU-467: moneda del pedido, fija desde su creación (pago, reembolso, correos y reportes).';
comment on column public.orders.tax_amount is 'HU-467: impuesto del pedido (incluido o agregado según el mercado).';
comment on column public.orders.fx_rate is 'HU-467: tasa usada para convertir desde la moneda base (NULL = misma moneda).';

-- ── Valor almacenado en su moneda ────────────────────────────────────────────
alter table public.coupons add column if not exists currency text;
comment on column public.coupons.currency is 'HU-467: moneda de un cupón de monto fijo (NULL = moneda base).';
alter table public.gift_cards add column if not exists currency text;
comment on column public.gift_cards.currency is 'HU-467: moneda de la gift card (NULL = moneda base).';

-- Rollback (staging):
--   alter table public.markets drop column if exists fx_rate, drop column if exists price_rounding,
--     drop column if exists tax_rate, drop column if exists tax_included;
--   alter table public.price_lists drop column if exists currency;
--   alter table public.orders drop column if exists currency, drop column if exists tax_amount,
--     drop column if exists fx_rate, drop column if exists market_key;
--   alter table public.coupons drop column if exists currency;
--   alter table public.gift_cards drop column if exists currency;
