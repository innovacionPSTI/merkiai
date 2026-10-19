-- =============================================================================
-- E17 · HU-148 Fase 2 — Canje de gift card / saldo en el checkout
-- =============================================================================
-- Columnas para registrar en la orden cuánto se pagó con gift card y/o saldo a
-- favor (auditable y base para reembolsos). El `total` de la orden sigue siendo
-- el monto efectivamente cobrado a la pasarela (tras el crédito). Idempotente.
-- Aplicar en el proyecto Supabase del PLANO DE TIENDA.
-- =============================================================================

alter table public.orders
  add column if not exists gift_card_code     text,
  add column if not exists gift_card_amount   int not null default 0,
  add column if not exists store_credit_amount int not null default 0;
