-- =============================================================================
-- E28 · HU-466 — Idioma de la interfaz por usuario del panel
-- =============================================================================
-- Preferencia personal del administrador/staff (independiente de los idiomas
-- de la tienda). NULL = automático (cookie del navegador → Accept-Language → es-CO).
-- Aditiva e idempotente. Plano de TIENDA.
-- =============================================================================

alter table public.profiles add column if not exists ui_locale text;

do $$ begin
  alter table public.profiles
    add constraint profiles_ui_locale_supported check (ui_locale is null or ui_locale in ('es-CO', 'es-MX', 'es-ES', 'en-US'));
exception when duplicate_object then null; end $$;

comment on column public.profiles.ui_locale is 'E28 · HU-466: idioma de la interfaz del panel para este usuario (NULL = automático).';

-- Rollback (staging): alter table public.profiles drop column if exists ui_locale;
