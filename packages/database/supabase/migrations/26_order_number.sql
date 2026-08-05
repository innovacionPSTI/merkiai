-- ============================================================
-- 26 · Número de orden: secuencia atómica + prefijo configurable
-- ============================================================
-- Reemplaza la generación por COUNT(*)+1 (insegura ante concurrencia y borrados)
-- por una secuencia de Postgres. El prefijo deja de estar hardcodeado y se lee
-- de store_config.order_prefix (de-brandeado, configurable desde el admin).
--
-- Fresh deploy: ya incluido en 01_schema.sql. Existentes: usar upgrade.sql.
-- ============================================================

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS order_prefix TEXT NOT NULL DEFAULT 'ORD';

CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Continúa por encima del máximo actual para no colisionar con los ya emitidos.
SELECT setval('order_number_seq', GREATEST((SELECT COUNT(*) FROM orders), 1), true);

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_n      bigint;
BEGIN
  SELECT NULLIF(order_prefix, '') INTO v_prefix FROM store_config WHERE id = 1;
  v_prefix := COALESCE(v_prefix, 'ORD');
  v_n := nextval('order_number_seq');
  RETURN v_prefix || '-' || lpad(v_n::text, 4, '0');
END;
$$;
