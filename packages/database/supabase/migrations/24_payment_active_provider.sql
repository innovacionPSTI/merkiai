-- Migration 24: Pasarela de pago única activa (espejo de shipping_config.provider) + Bold
--
-- 1) Reemplaza los tres toggles independientes (wompi_active, mercadopago_active,
--    tucompra_active) por un único campo `active_provider`. Solo una pasarela puede
--    estar activa a la vez; 'none' = sin pago en línea (validación manual del admin).
-- 2) Añade la pasarela Bold (bold_api_key, bold_secret_key, bold_sandbox).
--
-- Valores de active_provider: 'none' | 'wompi' | 'mercadopago' | 'tucompra' | 'bold'

-- 1) Nueva columna de pasarela activa
ALTER TABLE payment_config
  ADD COLUMN IF NOT EXISTS active_provider TEXT NOT NULL DEFAULT 'none'
    CHECK (active_provider IN ('none', 'wompi', 'mercadopago', 'tucompra', 'bold'));

-- 2) Credenciales de Bold
ALTER TABLE payment_config
  ADD COLUMN IF NOT EXISTS bold_api_key    TEXT NULL,
  ADD COLUMN IF NOT EXISTS bold_secret_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS bold_sandbox    BOOLEAN NOT NULL DEFAULT true;

-- 3) Back-fill de la pasarela activa desde los booleanos previos
--    (prioridad wompi > mercadopago > tucompra)
UPDATE payment_config
SET active_provider = CASE
  WHEN wompi_active       THEN 'wompi'
  WHEN mercadopago_active THEN 'mercadopago'
  WHEN tucompra_active    THEN 'tucompra'
  ELSE 'none'
END
WHERE active_provider = 'none';

-- 4) Eliminar los booleanos independientes (modelo unificado)
ALTER TABLE payment_config
  DROP COLUMN IF EXISTS wompi_active,
  DROP COLUMN IF EXISTS mercadopago_active,
  DROP COLUMN IF EXISTS tucompra_active;

-- 5) Ampliar el CHECK de orders.payment_method para aceptar tucompra, bold y manual
--    (el original solo permitía wompi/mercadopago). Idempotente.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('wompi', 'mercadopago', 'tucompra', 'bold', 'manual'));

COMMENT ON COLUMN payment_config.active_provider IS
  'Pasarela de pago activa (única). ''none'' = sin pago en línea; el pedido queda pendiente de validación manual del administrador.';
COMMENT ON COLUMN payment_config.bold_api_key IS
  'Bold: llave de identidad (API key) para crear links de pago (header Authorization: x-api-key).';
COMMENT ON COLUMN payment_config.bold_secret_key IS
  'Bold: llave secreta para verificar la firma HMAC-SHA256 del webhook (x-bold-signature).';
