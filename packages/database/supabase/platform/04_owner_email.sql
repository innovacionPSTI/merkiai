-- =============================================================================
-- Plataforma · tenants.owner_email  (mostrar el dueño en la consola)
-- =============================================================================
-- Guarda el email del dueño (super_admin) del tenant como conveniencia para el
-- listado de la consola. La fuente de verdad del rol sigue siendo `profiles`
-- (BD de tienda); esto es un denormalizado que se escribe al aprovisionar y al
-- (re)asignar dueño. Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA.
-- =============================================================================

alter table public.tenants
  add column if not exists owner_email text;
