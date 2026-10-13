-- ─────────────────────────────────────────────────────────────────────────────
-- HU-281 · Matriz rol→secciones por plan
--
-- Permite que cada plan amplíe o recorte qué secciones del admin ve cada rol de
-- STAFF (vendedor, gestor_tienda). admin y super_admin siempre tienen acceso
-- completo (no se configuran, para evitar bloqueos del propietario).
--
-- Forma: { "vendedor": ["dashboard","productos",...], "gestor_tienda": [...] }
-- Un rol ausente/vacío → usa el acceso por defecto definido en el código.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.plans
  add column if not exists role_access jsonb not null default '{}';

comment on column public.plans.role_access is 'Matriz rol→secciones del admin por plan (solo roles de staff). Rol ausente = acceso por defecto del código.';
