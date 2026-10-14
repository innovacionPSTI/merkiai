-- =============================================================================
-- E17 · HU-101 v2 — Voto "útil" en reseñas
-- =============================================================================
-- Contador de votos útiles por reseña + RPC para incrementarlo desde el
-- storefront (anon) sin abrir un UPDATE general por RLS. El RPC es
-- SECURITY DEFINER pero se acota al tenant del JWT y solo a reseñas aprobadas,
-- así el público solo puede sumar 1 a reseñas visibles de su propia tienda.
-- Idempotente. Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

alter table public.product_reviews
  add column if not exists helpful_count int not null default 0;

create or replace function public.increment_review_helpful(p_id int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid := (auth.jwt() ->> 'tenant_id')::uuid;
  v_count  int;
begin
  update public.product_reviews
     set helpful_count = helpful_count + 1
   where id = p_id
     and status = 'approved'
     and tenant_id = v_tenant
  returning helpful_count into v_count;
  return v_count;  -- null si no existe/visible
end;
$$;

grant execute on function public.increment_review_helpful(int) to anon, authenticated;
