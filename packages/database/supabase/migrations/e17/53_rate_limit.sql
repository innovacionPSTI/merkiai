-- =============================================================================
-- E17 · HU-300 (residual) — Rate-limit DISTRIBUIDO + bloqueo por N intentos
-- =============================================================================
-- El rate-limit en memoria no sirve en serverless (cada instancia tiene su
-- propio contador). Esta RPC centraliza el conteo por (tenant, bucket, ident)
-- en una fila con bloqueo (FOR UPDATE), de modo que el límite es efectivo a
-- través de todas las instancias. Además aplica un BLOQUEO (cooldown) cuando se
-- superan los intentos dentro de la ventana, para frenar enumeración/abuso.
-- Idempotente. Aplicar en el PLANO DE TIENDA.
-- =============================================================================

create table if not exists public.rate_limit_counters (
  tenant_id     uuid not null,
  bucket        text not null,           -- p. ej. 'checkout.coupon', 'checkout.credit'
  ident         text not null,           -- p. ej. IP o IP+cuenta
  window_start  timestamptz not null default now(),
  count         int not null default 0,
  blocked_until timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (tenant_id, bucket, ident)
);

alter table public.rate_limit_counters enable row level security;
-- Sin políticas de lectura pública: solo la RPC (SECURITY DEFINER) y el panel
-- (service-role) tocan esta tabla; el cliente nunca la consulta.

create or replace function public.rate_limit_hit(
  p_tenant       uuid,
  p_bucket       text,
  p_ident        text,
  p_window_secs  int,
  p_max          int,
  p_lock_secs    int default 0
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        int;
  v_blocked      timestamptz;
  v_now          timestamptz := now();
  v_just_locked  boolean := false;
begin
  insert into public.rate_limit_counters (tenant_id, bucket, ident, window_start, count)
    values (p_tenant, p_bucket, p_ident, v_now, 0)
    on conflict (tenant_id, bucket, ident) do nothing;

  select window_start, count, blocked_until
    into v_window_start, v_count, v_blocked
    from public.rate_limit_counters
   where tenant_id = p_tenant and bucket = p_bucket and ident = p_ident
   for update;

  -- En cooldown: sigue bloqueado hasta que expire.
  if v_blocked is not null and v_now < v_blocked then
    return json_build_object('allowed', false, 'count', v_count, 'blocked_until', v_blocked, 'locked', true);
  end if;

  -- Ventana expirada (o recién salido de cooldown): reinicia el contador.
  if v_blocked is not null and v_now >= v_blocked then
    v_window_start := v_now; v_count := 0; v_blocked := null;
  elsif v_now - v_window_start > make_interval(secs => p_window_secs) then
    v_window_start := v_now; v_count := 0;
  end if;

  v_count := v_count + 1;

  -- Supera el máximo de la ventana → se niega; si hay cooldown configurado, bloquea.
  if v_count > p_max then
    if p_lock_secs > 0 and v_blocked is null then
      v_blocked := v_now + make_interval(secs => p_lock_secs);
      v_just_locked := true;   -- primera vez que entra en cooldown (para alertar una sola vez)
    end if;
    update public.rate_limit_counters
       set window_start = v_window_start, count = v_count, blocked_until = v_blocked, updated_at = v_now
     where tenant_id = p_tenant and bucket = p_bucket and ident = p_ident;
    return json_build_object('allowed', false, 'count', v_count, 'blocked_until', v_blocked, 'locked', v_just_locked);
  end if;

  update public.rate_limit_counters
     set window_start = v_window_start, count = v_count, blocked_until = v_blocked, updated_at = v_now
   where tenant_id = p_tenant and bucket = p_bucket and ident = p_ident;

  return json_build_object('allowed', true, 'count', v_count, 'blocked_until', null, 'locked', false);
end;
$$;

grant execute on function public.rate_limit_hit(uuid, text, text, int, int, int) to authenticated, service_role;
