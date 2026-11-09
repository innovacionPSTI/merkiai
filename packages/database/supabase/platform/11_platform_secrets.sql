-- =============================================================================
-- E17 · HU-362 — Almacén de secretos cifrados (SecretStore) · BD de PLATAFORMA
-- =============================================================================
-- Persiste el `SecretRecord` del EnvelopeVault (ADR-007 §4): SOLO material
-- cifrado, nunca valores en claro. Un `ref` opaco (p. ej. "vault:anon:ab12…")
-- es la clave; las columnas guardan la DEK cifrada por KMS + el valor cifrado
-- con esa DEK (AES-256-GCM). Sin la llave IAM→KMS, estos blobs son inútiles.
--
-- Lo consume el CONTROL PLANE (console), único que habla con AWS KMS. Sirve
-- tanto para secretos por-tenant (referenciados desde tenant_infra_config) como
-- para secretos de plataforma por-entorno (HOSTING_API_TOKEN, llaves IAM futuras).
--
-- Idempotente. Aplicar en el proyecto Supabase de PLATAFORMA. NUNCA en claro aquí.
-- =============================================================================

create table if not exists public.platform_secrets (
  ref           text primary key,          -- token opaco (lo guarda secret_ref_* / config)
  name          text not null,             -- etiqueta legible (p. ej. 'anon', 'jwt')
  encrypted_key text not null,             -- base64: DEK cifrada por la KEK (KMS)
  iv            text not null,             -- base64: nonce AES-GCM
  auth_tag      text not null,             -- base64: tag de integridad AES-GCM
  ciphertext    text not null,             -- base64: valor cifrado con la DEK
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists platform_secrets_name_idx on public.platform_secrets (name);

comment on table public.platform_secrets is
  'HU-362 · SecretStore del EnvelopeVault. SOLO material cifrado (DEK cifrada por KMS + valor cifrado). Solo control plane (service-role). Nunca valores en claro.';

-- RLS habilitada SIN política pública: solo el service-role del control plane.
alter table public.platform_secrets enable row level security;
