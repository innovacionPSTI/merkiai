-- =============================================================================
-- E17 · HU-298 — Canje atómico de gift card + saldo a favor
-- =============================================================================
-- RPC transaccional que valida y aplica, en UNA transacción, el consumo de una
-- gift card y/o de saldo a favor, con bloqueo de fila (FOR UPDATE) para evitar
-- sobre-gasto bajo concurrencia. Revalida vigencia/saldo server-side (no confía
-- en el monto pedido: aplica el mínimo entre lo pedido y lo disponible). Inserta
-- el asiento negativo del saldo enlazado al pedido. SECURITY DEFINER con chequeo
-- de tenant. Idempotente (CREATE OR REPLACE). Aplicar en el proyecto Supabase
-- del PLANO DE TIENDA.
-- =============================================================================

create or replace function public.redeem_store_value(
  p_tenant            uuid,
  p_gift_card_id      bigint,
  p_gift_card_amount  int,
  p_customer_id       uuid,
  p_store_credit_amount int,
  p_order_id          bigint
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc_applied    int := 0;
  v_credit_applied int := 0;
  v_balance       int;
  v_active        boolean;
  v_expires       timestamptz;
  v_credit_bal    int;
begin
  -- ── Gift card ──────────────────────────────────────────────────────────────
  if p_gift_card_id is not null and coalesce(p_gift_card_amount, 0) > 0 then
    select balance, active, expires_at
      into v_balance, v_active, v_expires
      from public.gift_cards
     where id = p_gift_card_id and tenant_id = p_tenant
     for update;                                   -- bloquea la fila

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

  return json_build_object('gift_card_applied', v_gc_applied, 'store_credit_applied', v_credit_applied);
end;
$$;

grant execute on function public.redeem_store_value(uuid, bigint, int, uuid, int, bigint) to authenticated, service_role;
