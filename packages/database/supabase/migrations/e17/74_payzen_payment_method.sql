-- =============================================================================
-- E17 · HU-442 — PayZen como medio de pago de las ventas de la tienda
-- =============================================================================
-- Amplía el CHECK de orders.payment_method con 'payzen' (BYO y "Merkiai Pagos"
-- usan el mismo gateway). Las credenciales viven en integration_instances
-- (provider 'payzen'), sin columnas nuevas. Idempotente.
-- =============================================================================
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('wompi', 'mercadopago', 'tucompra', 'bold', 'payzen', 'manual'));
