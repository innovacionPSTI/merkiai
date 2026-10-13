-- =============================================================================
-- E17 · store_config — toggle "Mostrar lista de deseos" en la barra de navegación
-- =============================================================================
-- La wishlist (HU-103) se mostraba siempre en el navbar; ahora es configurable
-- como el carrito y el acceso. Default true (comportamiento actual). Idempotente.
-- Aplicar en el Supabase del PLANO DE TIENDA.
-- =============================================================================

alter table public.store_config
  add column if not exists nav_show_wishlist boolean not null default true;

-- Rollback: alter table public.store_config drop column if exists nav_show_wishlist;
