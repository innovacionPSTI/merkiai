#!/usr/bin/env bash
# =============================================================================
# db-apply-platform.sh — Aplica el schema de la BD de PLATAFORMA (console).
# Corre platform/*.sql en orden (01 → 14 …). Sin seeds: los planes base vienen
# en 03_plans.sql y el seed e2e solo lo usa scripts/e2e-provision.sh.
# Todo es idempotente (if not exists / drop+add constraint) → re-ejecutar es seguro.
#
# Uso:
#   PLATFORM_DATABASE_URL=postgres://... scripts/db-apply-platform.sh
# =============================================================================
set -euo pipefail

: "${PLATFORM_DATABASE_URL:?Define PLATFORM_DATABASE_URL (postgres://... de la BD de plataforma)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLATFORM="$ROOT/packages/database/supabase/platform"

for f in $(ls "$PLATFORM"/*.sql | sort); do
  echo "→ aplicando: ${f#$ROOT/}"
  psql "$PLATFORM_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "✓ Schema de plataforma aplicado."
