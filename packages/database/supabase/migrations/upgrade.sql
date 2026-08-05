-- ============================================================
-- Commerce CMS — Upgrade consolidado (post baseline v13 → v16)
-- ============================================================
--
-- Un ÚNICO archivo idempotente que fusiona las migraciones 21–25:
--   21 · store_config.favicon_url
--   22 · tabla admin_config
--   23 · store_config.email_provider + campos Tu Compra en payment_config
--   24 · payment_config.active_provider (+ Bold) y CHECK de orders.payment_method
--   25 · inventario: allow_backorder, flags de stock y RPC atómicas
--
-- Uso:
--   · Despliegue NUEVO  → ejecutar solo `01_schema.sql` (ya incluye todo esto).
--   · BD EXISTENTE      → ejecutar SOLO este `upgrade.sql`.
-- Es seguro re-ejecutarlo (ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE / etc.).
-- ============================================================

-- ── 21 · favicon ──────────────────────────────────────────────────────────────
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- ── 22 · admin_config (apariencia del panel) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_config (
  id            INTEGER     PRIMARY KEY DEFAULT 1,
  accent_color  TEXT        NOT NULL DEFAULT '#4F46E5',
  sidebar_color TEXT        NOT NULL DEFAULT '#0F172A',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_config_singleton CHECK (id = 1)
);
INSERT INTO admin_config (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- ── 23 · proveedor de email + Tu Compra ──────────────────────────────────────
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS email_provider TEXT NOT NULL DEFAULT 'resend';
-- (CHECK de email_provider se omite aquí para permitir añadir proveedores sin
--  romper instalaciones; el esquema canónico sí lo declara.)

ALTER TABLE payment_config
  ADD COLUMN IF NOT EXISTS tucompra_merchant_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS tucompra_secret_key  TEXT NULL,
  ADD COLUMN IF NOT EXISTS tucompra_sandbox     BOOLEAN NOT NULL DEFAULT true;

-- ── 24 · pasarela única (active_provider) + Bold ─────────────────────────────
ALTER TABLE payment_config
  ADD COLUMN IF NOT EXISTS active_provider TEXT NOT NULL DEFAULT 'none'
    CHECK (active_provider IN ('none', 'wompi', 'mercadopago', 'tucompra', 'bold')),
  ADD COLUMN IF NOT EXISTS bold_api_key    TEXT NULL,
  ADD COLUMN IF NOT EXISTS bold_secret_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS bold_sandbox    BOOLEAN NOT NULL DEFAULT true;

-- Back-fill de la pasarela activa desde los booleanos previos (si existían)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'payment_config' AND column_name = 'wompi_active') THEN
    UPDATE payment_config SET active_provider = CASE
      WHEN wompi_active       THEN 'wompi'
      WHEN mercadopago_active THEN 'mercadopago'
      WHEN tucompra_active    THEN 'tucompra'
      ELSE 'none'
    END
    WHERE active_provider = 'none';
  END IF;
END $$;

ALTER TABLE payment_config
  DROP COLUMN IF EXISTS wompi_active,
  DROP COLUMN IF EXISTS mercadopago_active,
  DROP COLUMN IF EXISTS tucompra_active;

-- CHECK de orders.payment_method (antes solo permitía wompi/mercadopago)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('wompi', 'mercadopago', 'tucompra', 'bold', 'manual'));

-- ── 25 · inventario ──────────────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_applied  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_restored BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id integer, p_qty integer)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE v_allow boolean; v_updated integer;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN RETURN true; END IF;
  SELECT COALESCE(p.allow_backorder, false) INTO v_allow
    FROM product_variants pv JOIN products p ON p.id = pv.product_id
    WHERE pv.id = p_variant_id;
  UPDATE product_variants SET stock = stock - p_qty
    WHERE id = p_variant_id AND (v_allow OR stock >= p_qty);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END; $$;

CREATE OR REPLACE FUNCTION restore_variant_stock(p_variant_id integer, p_qty integer)
RETURNS void LANGUAGE sql AS $$
  UPDATE product_variants SET stock = stock + p_qty
    WHERE id = p_variant_id AND p_qty > 0;
$$;

-- ── 26 · número de orden: secuencia atómica + prefijo configurable ────────────
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS order_prefix TEXT NOT NULL DEFAULT 'ORD';

CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Inicializa la secuencia por encima del máximo actual para no colisionar con los
-- order_number ya existentes (el esquema previo usaba COUNT(*)+1).
SELECT setval('order_number_seq', GREATEST((SELECT COUNT(*) FROM orders), 1), true);

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_prefix text; v_n bigint;
BEGIN
  SELECT NULLIF(order_prefix, '') INTO v_prefix FROM store_config WHERE id = 1;
  v_prefix := COALESCE(v_prefix, 'ORD');
  v_n := nextval('order_number_seq');
  RETURN v_prefix || '-' || lpad(v_n::text, 4, '0');
END; $$;
