-- Migration 25: Control de inventario (Épica 9 · HU-097/098)
--
-- 1) products.allow_backorder — permitir vender sin stock (bajo pedido).
-- 2) orders.stock_applied / stock_restored — flags de idempotencia para
--    descontar/reponer stock una sola vez por pedido.
-- 3) RPC atómicas: decrement_variant_stock (respeta backorder) y restore_variant_stock.

-- 1) Backorder por producto
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.allow_backorder IS
  'Si es true, se permite vender el producto aunque no haya stock (bajo pedido). El stock puede quedar negativo.';

-- 2) Idempotencia del movimiento de stock por pedido
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_applied  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_restored BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN orders.stock_applied IS
  'true cuando ya se descontó el stock de este pedido (al aprobarse el pago). Evita doble descuento en reintentos de webhook.';
COMMENT ON COLUMN orders.stock_restored IS
  'true cuando ya se repuso el stock de este pedido (al cancelarse/rechazarse). Evita doble reposición.';

-- 3a) Descuento atómico: respeta allow_backorder del producto de la variante.
--     Devuelve true si descontó; false si no había stock suficiente y no hay backorder.
CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id integer, p_qty integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_allow   boolean;
  v_updated integer;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN true;
  END IF;

  SELECT COALESCE(p.allow_backorder, false) INTO v_allow
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id;

  UPDATE product_variants
  SET stock = stock - p_qty
  WHERE id = p_variant_id
    AND (v_allow OR stock >= p_qty);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- 3b) Reposición de stock (al cancelar/rechazar un pedido ya descontado).
CREATE OR REPLACE FUNCTION restore_variant_stock(p_variant_id integer, p_qty integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE product_variants
  SET stock = stock + p_qty
  WHERE id = p_variant_id AND p_qty > 0;
$$;
