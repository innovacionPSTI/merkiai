-- =============================================================================
-- E17 · ADR-004 (HU-277) — Backfill: payment_config → integration_instances
-- =============================================================================
-- Crea una instancia de pago por cada pasarela configurada en payment_config,
-- con credenciales genéricas (claves del registry), entorno inferido y
-- is_active = (active_provider = proveedor). Idempotente: no duplica si ya existe
-- una instancia de ese (tenant, provider). El resolver prefiere instancias sobre
-- el legacy, así que tras este backfill el runtime lee de integration_instances.
-- Aplicar DESPUÉS de e17/26. Supabase del PLANO DE TIENDA.
-- =============================================================================

-- Wompi
insert into public.integration_instances (tenant_id, kind, provider, label, environment, credentials, settings, enabled, is_active)
select pc.tenant_id, 'payment', 'wompi', 'Wompi',
  case when pc.wompi_public_key like 'pub_prod%' then 'production' else 'test' end,
  jsonb_strip_nulls(jsonb_build_object(
    'public_key', pc.wompi_public_key, 'private_key', pc.wompi_private_key,
    'integrity_secret', pc.wompi_integrity_secret, 'events_secret', pc.wompi_events_secret)),
  '{}'::jsonb, true, (pc.active_provider = 'wompi')
from public.payment_config pc
where pc.wompi_public_key is not null
  and not exists (select 1 from public.integration_instances ii
                  where ii.tenant_id = pc.tenant_id and ii.kind = 'payment' and ii.provider = 'wompi');

-- MercadoPago
insert into public.integration_instances (tenant_id, kind, provider, label, environment, credentials, settings, enabled, is_active)
select pc.tenant_id, 'payment', 'mercadopago', 'MercadoPago',
  case when coalesce(pc.mercadopago_public_key, pc.mercadopago_access_token) like 'APP_USR%' then 'production' else 'test' end,
  jsonb_strip_nulls(jsonb_build_object(
    'access_token', pc.mercadopago_access_token, 'public_key', pc.mercadopago_public_key,
    'webhook_secret', pc.mercadopago_webhook_secret)),
  '{}'::jsonb, true, (pc.active_provider = 'mercadopago')
from public.payment_config pc
where (pc.mercadopago_access_token is not null or pc.mercadopago_public_key is not null)
  and not exists (select 1 from public.integration_instances ii
                  where ii.tenant_id = pc.tenant_id and ii.kind = 'payment' and ii.provider = 'mercadopago');

-- Tu Compra
insert into public.integration_instances (tenant_id, kind, provider, label, environment, credentials, settings, enabled, is_active)
select pc.tenant_id, 'payment', 'tucompra', 'Tu Compra',
  case when pc.tucompra_api_url like '%ws2.tucompra.com.co%' then 'production' else 'test' end,
  jsonb_strip_nulls(jsonb_build_object(
    'user', pc.tucompra_user, 'password', pc.tucompra_password, 'terminal', pc.tucompra_terminal,
    'public_key', pc.tucompra_public_key, 'encryption_key', pc.tucompra_encryption_key)),
  jsonb_build_object('api_url', pc.tucompra_api_url, 'methods', coalesce(pc.tucompra_methods, '[]'::jsonb)),
  true, (pc.active_provider = 'tucompra')
from public.payment_config pc
where pc.tucompra_user is not null
  and not exists (select 1 from public.integration_instances ii
                  where ii.tenant_id = pc.tenant_id and ii.kind = 'payment' and ii.provider = 'tucompra');

-- Bold
insert into public.integration_instances (tenant_id, kind, provider, label, environment, credentials, settings, enabled, is_active)
select pc.tenant_id, 'payment', 'bold', 'Bold',
  case when coalesce(pc.bold_sandbox, true) then 'test' else 'production' end,
  jsonb_strip_nulls(jsonb_build_object('api_key', pc.bold_api_key, 'secret_key', pc.bold_secret_key)),
  jsonb_build_object('sandbox', coalesce(pc.bold_sandbox, true)),
  true, (pc.active_provider = 'bold')
from public.payment_config pc
where pc.bold_api_key is not null
  and not exists (select 1 from public.integration_instances ii
                  where ii.tenant_id = pc.tenant_id and ii.kind = 'payment' and ii.provider = 'bold');

-- =============================================================================
-- Rollback (solo las creadas por backfill de pago):
--   delete from public.integration_instances where kind = 'payment';
-- =============================================================================
