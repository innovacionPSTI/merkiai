#!/usr/bin/env bash
# =============================================================================
# db-apply.sh — Aplica el schema del PLANO DE TIENDA a una base Postgres.
# Orden: baseline → upgrade consolidado → migraciones e17 (ordenadas) → seeds.
# Todo el SQL de e17 es aditivo e idempotente, así que re-ejecutar es seguro.
#
# Uso:
#   DATABASE_URL=postgres://... scripts/db-apply.sh [--no-seeds]
#
# Pensado para CI (Supabase branch/preview o Postgres de servicio) y para
# levantar un entorno de pruebas local reproducible. En PRODUCCIÓN usar SIEMPRE
# `--no-seeds` (los seeds base son de demo; la config por tenant la crea la consola).
# =============================================================================
set -euo pipefail

: "${DATABASE_URL:?Define DATABASE_URL (postgres://...)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="$ROOT/packages/database/supabase/migrations"
SEEDS="$ROOT/packages/database/supabase/seeds"
WITH_SEEDS=1
[[ "${1:-}" == "--no-seeds" ]] && WITH_SEEDS=0

run() {
  echo "→ aplicando: ${1#$ROOT/}"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$1"
}

echo "== Baseline + upgrade =="
run "$MIG/01_schema.sql"
run "$MIG/upgrade.sql"

echo "== Migraciones e17 (ordenadas) =="
for f in $(ls "$MIG"/e17/*.sql | sort); do run "$f"; done

if [[ "$WITH_SEEDS" == "1" ]]; then
  echo "== Seeds (config + contenido base; sin datos de verticales) =="
  run "$SEEDS/01_config.sql"
  run "$SEEDS/02_content.sql"
fi

echo "✓ Schema del plano de tienda aplicado."
