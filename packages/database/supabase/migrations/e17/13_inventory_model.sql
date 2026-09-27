-- =============================================================================
-- E17 · HU-237 — Modelo de inventario por tienda (single vs multi-ubicación)
-- =============================================================================
-- `store_config.inventory_model` decide cómo se lleva el stock del tenant:
--   'single'        → stock único por variante (comportamiento actual).
--   'multi_location'→ stock por ubicación (habilita E18; gated por la feature
--                     `multi_location` del plan — el enforcement es server-side,
--                     la columna solo guarda la elección hecha en el onboarding).
-- El default 'single' asegura que las tiendas existentes no cambian de conducta.
-- Idempotente. Aplicar en el proyecto Supabase de admin/web (plano de tienda).
-- =============================================================================

alter table public.store_config
  add column if not exists inventory_model text not null default 'single';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'store_config_inventory_model_check'
  ) then
    alter table public.store_config
      add constraint store_config_inventory_model_check
      check (inventory_model in ('single','multi_location'));
  end if;
end$$;
