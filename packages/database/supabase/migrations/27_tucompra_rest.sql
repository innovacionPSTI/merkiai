-- ============================================================
-- 27 · Tu Compra — migración a la API REST (token JWT)
-- ============================================================
-- La integración anterior (form-POST + MD5) no correspondía a la API real de
-- Tu Compra. La API REST usa autenticación por token (usuario/clave/terminal) y
-- una URL base configurable (demo/prod). Se añaden los campos reales.
-- Los campos antiguos (tucompra_merchant_id/secret_key) se conservan como
-- deprecados. `tucompra_public_key` (RSA) solo aplica al pago de tarjeta directo.
--
-- Fresh deploy: ya incluido en 01_schema.sql. Existentes: usar upgrade.sql.
-- ============================================================

ALTER TABLE payment_config
  ADD COLUMN IF NOT EXISTS tucompra_user       TEXT,
  ADD COLUMN IF NOT EXISTS tucompra_password   TEXT,
  ADD COLUMN IF NOT EXISTS tucompra_terminal   TEXT,
  ADD COLUMN IF NOT EXISTS tucompra_api_url    TEXT,
  ADD COLUMN IF NOT EXISTS tucompra_public_key TEXT,
  -- Medios habilitados + id de MetodoPago (difieren demo/prod). Ej:
  -- [{"tipo":"pse","id":"41","enabled":true},{"tipo":"nequi","id":"72","enabled":true}]
  ADD COLUMN IF NOT EXISTS tucompra_methods    JSONB NOT NULL DEFAULT '[]';
