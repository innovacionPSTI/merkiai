-- =============================================================================
-- E26 · HU-431 — Ajustes de plataforma (clave → valor NO secreto)
-- =============================================================================
-- Guarda configuración de la plataforma editable desde la consola. Para
-- secretos guarda SOLO la referencia al vault (p. ej. `hosting.cloudflare_token_ref`),
-- nunca el valor. Solo control plane (RLS sin políticas). Idempotente.
-- =============================================================================
create table if not exists public.platform_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;
