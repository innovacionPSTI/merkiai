#!/usr/bin/env bash
# =============================================================================
# e2e-provision.sh — Aprovisiona TODO el entorno de pruebas de una sola vez,
# de forma idempotente, para que las E2E corran sin pasos manuales:
#
#   1. Schema de PLATAFORMA (control plane) + plan `e2e` (todas las features) +
#      tenant de prueba  → PLATFORM_DATABASE_URL
#   2. Schema de TIENDA (plano de tienda) + seeds base + perfil admin de prueba
#      (super_admin ligado al tenant)                → DATABASE_URL
#   3. Usuario admin en Stack Auth (registro deshabilitado → vía API de servidor)
#
# El catálogo/operaciones de ejemplo los siembra la propia suite (global-setup,
# E2E_SEED=1) reusando el endpoint interno de preset. Aquí dejamos el cimiento.
#
# Variables:
#   DATABASE_URL           (req)  Postgres del PLANO DE TIENDA (admin/web).
#   PLATFORM_DATABASE_URL  (opt)  Postgres de PLATAFORMA (consola). Si no se da,
#                                 se asume single-DB compartida = DATABASE_URL.
#   E2E_TENANT_ID          (opt)  Default: tenant de migración 0000…0001.
#   E2E_TENANT_SUBDOMAIN   (opt)  Default: 'e2e'.
#   E2E_ADMIN_EMAIL        (req para el perfil + Stack).
#   E2E_ADMIN_PASSWORD + claves HEXCLAVE_* (opt; para crear el usuario de Stack).
#
# Uso:  DATABASE_URL=… E2E_ADMIN_EMAIL=… scripts/e2e-provision.sh
# NUNCA apuntar a producción.
# =============================================================================
set -euo pipefail

: "${DATABASE_URL:?Define DATABASE_URL (Postgres del plano de tienda)}"
: "${E2E_ADMIN_EMAIL:?Define E2E_ADMIN_EMAIL (email del admin de prueba)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLATFORM="$ROOT/packages/database/supabase/platform"
SEEDS="$ROOT/packages/database/supabase/seeds"
TENANT_ID="${E2E_TENANT_ID:-00000000-0000-0000-0000-000000000001}"
SUBDOMAIN="${E2E_TENANT_SUBDOMAIN:-e2e}"
PLATFORM_URL="${PLATFORM_DATABASE_URL:-$DATABASE_URL}"

run() { echo "→ ${2#$ROOT/} ($1)"; psql "$1" -v ON_ERROR_STOP=1 -q -f "$2"; }

echo "== 1) Plataforma: schema + plan e2e + tenant de prueba =="
for f in $(ls "$PLATFORM"/*.sql | sort); do run "$PLATFORM_URL" "$f"; done
psql "$PLATFORM_URL" -v ON_ERROR_STOP=1 -q \
  -v tenant_id="'$TENANT_ID'" -v subdomain="'$SUBDOMAIN'" \
  -f "$PLATFORM/seeds/e2e.sql"

echo "== 2) Tienda: schema + seeds base + perfil admin de prueba =="
bash "$ROOT/scripts/db-apply.sh"              # baseline + e17 + seeds base (idempotente)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q \
  -v tenant_id="'$TENANT_ID'" -v admin_email="'$E2E_ADMIN_EMAIL'" \
  -f "$SEEDS/e2e-admin.sql"

echo "== 3) Stack Auth: usuario admin de prueba (idempotente, best-effort) =="
if [[ -f "$ROOT/apps/e2e/scripts/ensure-stack-user.mjs" ]]; then
  node "$ROOT/apps/e2e/scripts/ensure-stack-user.mjs" || true
fi

echo "✓ Entorno de pruebas aprovisionado (tenant=$TENANT_ID, admin=$E2E_ADMIN_EMAIL)."
echo "  Las E2E sembrarán el catálogo/operaciones de ejemplo al arrancar (E2E_SEED=1)."
