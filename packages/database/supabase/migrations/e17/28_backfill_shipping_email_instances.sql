-- =============================================================================
-- E17 · ADR-004 (HU-278) — Backfill: envíos y correo → integration_instances
-- =============================================================================
-- Crea instancias de ENVÍO (skydropx, desde shipping_config) y CORREO (resend,
-- desde store_config). Idempotente. Solo crea la estructura de datos; el runtime
-- (rates/shipments/email) aún lee las tablas legacy hasta su cutover.
-- Las credenciales van en `credentials`; los AJUSTES globales de envío
-- (tarifa fija, envío gratis, dirección de origen) permanecen en shipping_config
-- (no son por-instancia). Aplicar DESPUÉS de e17/26. Supabase del PLANO DE TIENDA.
-- =============================================================================

-- Envíos · Skydropx (credenciales de la cuenta)
insert into public.integration_instances (tenant_id, kind, provider, label, environment, credentials, settings, enabled, is_active)
select sc.tenant_id, 'shipping', 'skydropx', 'Skydropx',
  case when coalesce(sc.skydropx_base_url, '') ~* 'sandbox|demo' then 'test' else 'production' end,
  jsonb_strip_nulls(jsonb_build_object(
    'client_id', sc.skydropx_client_id, 'client_secret', sc.skydropx_client_secret,
    'address_from_id', sc.skydropx_address_from_id)),
  jsonb_build_object('base_url', sc.skydropx_base_url),
  true, (sc.provider = 'skydropx')
from public.shipping_config sc
where sc.skydropx_client_id is not null
  and not exists (select 1 from public.integration_instances ii
                  where ii.tenant_id = sc.tenant_id and ii.kind = 'shipping' and ii.provider = 'skydropx');

-- Correo · Resend (api key + remitente, desde store_config)
insert into public.integration_instances (tenant_id, kind, provider, label, environment, credentials, settings, enabled, is_active)
select st.tenant_id, 'email', 'resend', 'Resend', 'production',
  jsonb_strip_nulls(jsonb_build_object(
    'api_key', st.resend_api_key, 'from_email', st.resend_from_email)),
  '{}'::jsonb, true, true
from public.store_config st
where st.resend_api_key is not null
  and not exists (select 1 from public.integration_instances ii
                  where ii.tenant_id = st.tenant_id and ii.kind = 'email' and ii.provider = 'resend');

-- =============================================================================
-- Rollback:
--   delete from public.integration_instances where kind in ('shipping','email');
-- =============================================================================
