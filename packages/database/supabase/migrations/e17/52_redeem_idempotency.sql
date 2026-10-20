-- =============================================================================
-- E17 · HU-298 (residual) — Idempotencia por intento en el canje de valor
-- =============================================================================
-- Cierra el riesgo de "doble descuento" cuando un mismo intento de checkout se
-- reintenta (reenvío del cliente, retry de red): se agrega una CLAVE DE INTENTO
-- opcional. La RPC `redeem_store_value` registra un "reclamo" por (tenant, clave)
-- con patrón claim-row + FOR UPDATE: si la clave ya fue procesada, DEVUELVE los
-- montos aplicados antes SIN volver a descontar. Sin clave, el comportamiento es
-- idéntico al anterior (compatibilidad: tiendas que no la envían no cambian).
-- Idempotente (CREATE OR REPLACE / IF NOT EXISTS). Aplicar en el PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.store_value_redemptions (
  id                   bigint generated always as identity primary key,
  tenant_id            uuid not null,
  idempotency_key      text not null,
  status               text not null default 'pending',   -- 'pending' | 'done'
  gift_card_applied    int  not null default 0,
  store_credit_applied int  not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

alter table public.store_value_redemptions enable row level security;

-- Solo el panel (is_admin) puede leer estos registros de conciliación; el canje
-- lo escribe la RPC (SECURITY DEFINER), no el cliente.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'store_value_redemptions'
       and policyname = 'store_value_redemptions_admin_read'
  ) then
    create policy store_value_redemptions_admin_read
      on public.store_value_redemptions for select
      using ( (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean is true
              and tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid );
  end if;
end $$;

-- ── RPC con clave de intento opcional ────────────────────────────────────────
-- Se elimina la firma de 6 args para evitar overloads ambiguos en PostgREST.
drop function if exists public.redeem_store_value(uuid, bigint, int, uuid, int, bigint);

create or replace function public.redeem_store_value(
  p_tenant            uuid,
  p_gift_card_id      bigint,
  p_gift_card_amount  int,
  p_customer_id       uuid,
  p_store_credit_amount int,
  p_order_id          bigint,
  p_idempotency_key   text default null
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc_applied     int := 0;
  v_credit_applied int := 0;
  v_balance        int;
  v_active         boolean;
  v_expires        timestamptz;
  v_credit_bal     int;
  v_status         text;
begin
  -- ── Idempotencia por intento ────────────────────────────────────────────────
  if p_idempotency_key is not null and length(p_idempotency_key) > 0 then
    -- Reclama la clave (o no-op si ya existe) y bloquea la fila.
    insert into public.store_value_redemptions (tenant_id, idempotency_key)
      values (p_tenant, p_idempotency_key)
      on conflict (tenant_id, idempotency_key) do nothing;

    select status, gift_card_applied, store_credit_applied
      into v_status, v_gc_applied, v_credit_applied
      from public.store_value_redemptions
     where tenant_id = p_tenant and idempotency_key = p_idempotency_key
     for update;

    -- Reintento del mismo intento ya procesado → devuelve lo aplicado, sin descontar.
    if v_status = 'done' then
      return json_build_object('gift_card_applied', v_gc_applied, 'store_credit_applied', v_credit_applied);
    end if;
    v_gc_applied := 0; v_credit_applied := 0;
  end if;

  -- ── Gift card ──────────────────────────────────────────────────────────────
  if p_gift_card_id is not null and coalesce(p_gift_card_amount, 0) > 0 then
    select balance, active, expires_at
      into v_balance, v_active, v_expires
      from public.gift_cards
     where id = p_gift_card_id and tenant_id = p_tenant
     for update;

    if found and v_active and (v_expires is null or now() < v_expires) and v_balance > 0 then
      v_gc_applied := least(v_balance, p_gift_card_amount);
      update public.gift_cards
         set balance = balance - v_gc_applied, updated_at = now()
       where id = p_gift_card_id;
    end if;
  end if;

  -- ── Saldo a favor ────────────────────────────────────────────────────────────
  if p_customer_id is not null and coalesce(p_store_credit_amount, 0) > 0 then
    select coalesce(sum(delta), 0) into v_credit_bal
      from public.store_credit_ledger
     where customer_id = p_customer_id and tenant_id = p_tenant;

    v_credit_applied := least(greatest(v_credit_bal, 0), p_store_credit_amount);
    if v_credit_applied > 0 then
      insert into public.store_credit_ledger (tenant_id, customer_id, delta, reason, order_id)
      values (p_tenant, p_customer_id, -v_credit_applied, 'order', p_order_id);
    end if;
  end if;

  -- ── Cierra el reclamo con lo efectivamente aplicado ──────────────────────────
  if p_idempotency_key is not null and length(p_idempotency_key) > 0 then
    update public.store_value_redemptions
       set status = 'done', gift_card_applied = v_gc_applied,
           store_credit_applied = v_credit_applied, updated_at = now()
     where tenant_id = p_tenant and idempotency_key = p_idempotency_key;
  end if;

  return json_build_object('gift_card_applied', v_gc_applied, 'store_credit_applied', v_credit_applied);
end;
$$;

grant execute on function public.redeem_store_value(uuid, bigint, int, uuid, int, bigint, text) to authenticated, service_role;
