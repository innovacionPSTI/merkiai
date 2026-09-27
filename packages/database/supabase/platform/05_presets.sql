-- =============================================================================
-- Plataforma · presets  (HU-233 — Presets de nicho, ver ADR-002)
-- =============================================================================
-- Un PRESET es un bundle curado por nicho: Tema (paleta) + Template (layout) +
-- secciones de arranque del home + categorías/productos de ejemplo + modelo de
-- inventario sugerido. Vive en la BD de PLATAFORMA (lo cura el operador desde la
-- consola). "Aplicar preset" (HU-235) lo COPIA al store DB del tenant.
--
-- `available_in_plans`: lista de `plans.key` que pueden usar este preset. Vacío
-- = disponible en todos los planes (limita el nicho por plan sin tocar el plan).
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA.
-- =============================================================================

create table if not exists public.presets (
  key                text        primary key,        -- 'cafe-basico'
  name               text        not null,
  niche              text        not null,           -- 'cafe' | 'moda' | 'servicios' | …
  description        text,
  -- Contenido curado (se materializa en el tenant al aplicar):
  theme              jsonb       not null default '{}',   -- tokens de Tema (paleta)
  template           text        not null default 'default', -- Template (layout, código)
  home_sections      jsonb       not null default '[]',  -- secciones+ítems de arranque del home
  sample_categories  jsonb       not null default '[]',
  sample_products    jsonb       not null default '[]',
  inventory_model    text        not null default 'single'
                                  check (inventory_model in ('single','multi_location')),
  -- Gating por plan (vacío = todos):
  available_in_plans text[]      not null default '{}',
  active             boolean     not null default true,
  version            integer     not null default 1,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists presets_niche_idx  on public.presets (niche);
create index if not exists presets_active_idx on public.presets (active);
