-- =============================================================================
-- E17 · HU-298 — Reverso (compensación) de canje de gift card + saldo
-- =============================================================================
-- Deshace un canje previo cuando la creación del pedido falla DESPUÉS de aplicar
-- el crédito (evita "crédito consumido sin pedido"). Restituye el saldo de la
-- gift card y asienta un abono positivo en el ledger de saldo, en una sola
-- transacción. SECURITY DEFINER con chequeo de tenant. Idempotente
-- (CREATE OR REPLACE). Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

create or replace function public.refund_store_value(
  p_tenant             uuid,
  p_gift_card_id       bigint,
  p_gift_card_amount   int,
  p_customer_id        uuid,
  p_store_credit_amount int
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_gift_card_id is not null and coalesce(p_gift_card_amount, 0) > 0 then
    update public.gift_cards
       set balance = balance + p_gift_card_amount, updated_at = now()
     where id = p_gift_card_id and tenant_id = p_tenant;
  end if;

  if p_customer_id is not null and coalesce(p_store_credit_amount, 0) > 0 then
    insert into public.store_credit_ledger (tenant_id, customer_id, delta, reason)
    values (p_tenant, p_customer_id, p_store_credit_amount, 'refund_failed_order');
  end if;
end;
$$;

grant execute on function public.refund_store_value(uuid, bigint, int, uuid, int) to authenticated, service_role;
