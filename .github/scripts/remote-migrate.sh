#!/usr/bin/env bash
#
# Runs ON THE DEPLOY SERVER, piped in over ssh by .github/workflows/migrate.yml.
#
# This is the ONLY script in the repo permitted to write to the database, and it is
# only ever reachable through a manual workflow_dispatch with a typed confirmation.
#
# Order is deliberate: read state -> back up and VERIFY the backup -> only then write.
#
# `npm run migrate` works inside the container because the server's web.dockerfile
# runner stage copies the full node_modules (Payload CLI included) plus src/ (with
# src/migrations/) and payload.config.ts.
#
# Required env: APP_DIR CONTAINER
# Optional:     ACTION (status|up, default status)  PG_IMAGE

set -Eeuo pipefail

: "${APP_DIR:?APP_DIR is required}"
: "${CONTAINER:?CONTAINER is required}"

ACTION="${ACTION:-status}"
PG_IMAGE="${PG_IMAGE:-postgres:16-alpine}"
BACKUP_DIR="$APP_DIR/backups"
STAMP="$(date -u +%Y%m%d-%H%M%S)"

log() { printf '\n[migrate %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

# ---------------------------------------------------------------------------
# 1. Always report current state first. Pure read.
# ---------------------------------------------------------------------------
log "migrate:status BEFORE"
docker exec "$CONTAINER" npm run migrate:status

if [ "$ACTION" != "up" ]; then
  log "status-only run — nothing was written"
  exit 0
fi

# ---------------------------------------------------------------------------
# 2. Back up before any write, and refuse to proceed on a suspicious dump.
# ---------------------------------------------------------------------------
# build.env holds a read-only DATABASE_URL for builds; migrations need the
# read-write one, so use the container's own runtime credential instead.
DB_URL="$(docker exec "$CONTAINER" printenv DATABASE_URL)"
[ -n "$DB_URL" ] || { echo "FATAL: could not read DATABASE_URL from $CONTAINER"; exit 1; }

mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/mobis_${STAMP}.dump"

log "pg_dump -> $OUT"
docker run --rm -i "$PG_IMAGE" \
  pg_dump --format=custom --no-owner --no-privileges "$DB_URL" > "$OUT"

SIZE="$(stat -c%s "$OUT")"
if [ "$SIZE" -lt 100000 ]; then
  echo "FATAL: dump is only ${SIZE} bytes — aborting before any write"
  exit 1
fi

if ! docker run --rm -i "$PG_IMAGE" pg_restore --list < "$OUT" > /dev/null; then
  echo "FATAL: dump is not a valid pg_restore archive — aborting before any write"
  exit 1
fi
log "backup verified (${SIZE} bytes)"

# ---------------------------------------------------------------------------
# 3. Apply.
# ---------------------------------------------------------------------------
log "APPLYING MIGRATIONS"
docker exec "$CONTAINER" npm run migrate

log "migrate:status AFTER"
docker exec "$CONTAINER" npm run migrate:status

cat <<EOF

Backup retained at: $OUT
Restore command if needed (run on the server):
  docker run --rm -i $PG_IMAGE pg_restore --clean --if-exists -d "\$DATABASE_URL" < $OUT

EOF
