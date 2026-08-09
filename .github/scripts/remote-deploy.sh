#!/usr/bin/env bash
#
# Runs ON THE DEPLOY SERVER, piped in over ssh by .github/workflows/_deploy.yml.
#
# Design contract — every step is chosen against one requirement: never mutate the
# live database or the uploads volume.
#
#   * `git reset --hard` rewrites TRACKED files only. .env, private/secrets/*.json
#     and public/media/ are gitignored + untracked on the server, so they survive
#     verbatim. Wiping untracked files is banned outright — see the guard script.
#   * `docker compose build` and `docker compose up` are separate commands. A failed
#     build exits before `up` is ever reached, so the old container keeps serving.
#     `up --build` is never used — that is the usual way a bad build takes a site down.
#   * No migrations. No `down -v`. No `volume rm`. No `prune -a`/`--volumes`.
#
# Required env (exported by the ssh command line):
#   APP_DIR GIT_REF SERVICE CONTAINER UPLOADS_VOLUME
# Optional:
#   PORT HEALTH_PATH IMAGE TARGET_SHA

set -Eeuo pipefail

: "${APP_DIR:?APP_DIR is required}"
: "${GIT_REF:?GIT_REF is required}"
: "${SERVICE:?SERVICE is required}"
: "${CONTAINER:?CONTAINER is required}"
: "${UPLOADS_VOLUME:?UPLOADS_VOLUME is required}"

PORT="${PORT:-7884}"
HEALTH_PATH="${HEALTH_PATH:-/api/widget/status-check}"
IMAGE="${IMAGE:-$CONTAINER}"
SRC_DIR="$APP_DIR/src"
STAMP="$(date -u +%Y%m%d-%H%M%S)"

log() { printf '\n[deploy %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

# Liveness probe from inside the container: the app port is typically only exposed
# on the nginx-proxy network, not published to the host, so curl from the host fails.
# busybox wget ships with node:20-alpine.
health() {
  docker exec "$CONTAINER" wget -qO- --timeout=5 \
    "http://127.0.0.1:${PORT}${HEALTH_PATH}" 2>/dev/null | grep -q '"ok":true'
}

wait_healthy() {
  local attempts="$1" i
  for ((i = 1; i <= attempts; i++)); do
    if health; then return 0; fi
    sleep 5
  done
  return 1
}

# ---------------------------------------------------------------------------
# 0. Preconditions — fail before anything has been touched.
# ---------------------------------------------------------------------------
log "preflight"
[ -d "$SRC_DIR/.git" ]             || { echo "FATAL: $SRC_DIR is not a git checkout"; exit 1; }
[ -f "$APP_DIR/docker-compose.yml" ] || { echo "FATAL: $APP_DIR/docker-compose.yml missing"; exit 1; }
[ -f "$APP_DIR/build.env" ]        || { echo "FATAL: $APP_DIR/build.env missing (see docs/CICD-SETUP.md)"; exit 1; }

# If the uploads volume is gone, something is already very wrong — refuse to
# deploy rather than let compose helpfully create an empty replacement.
docker volume inspect "$UPLOADS_VOLUME" >/dev/null 2>&1 \
  || { echo "FATAL: uploads volume '$UPLOADS_VOLUME' not found — refusing to deploy"; exit 1; }

# ---------------------------------------------------------------------------
# 1. Establish the rollback point.
# ---------------------------------------------------------------------------
PREV_SHA="$(git -C "$SRC_DIR" rev-parse HEAD)"
log "current commit: $PREV_SHA"

# Record which server-only (untracked, gitignored) files exist BEFORE the reset.
# Comparing before/after is the point: asserting they must exist would wrongly fail
# on setups that pass everything through compose `environment:` and never create a
# .env at all. What matters is that nothing that WAS there disappears.
HAD_ENV=0;     [ -f "$SRC_DIR/.env" ]     && HAD_ENV=1
HAD_PRIVATE=0; [ -d "$SRC_DIR/private" ]  && HAD_PRIVATE=1
log "server-only files before reset: .env=$HAD_ENV private/=$HAD_PRIVATE"

HAVE_PREV_IMAGE=0
if docker image inspect "${IMAGE}:latest" >/dev/null 2>&1; then
  docker tag "${IMAGE}:latest" "${IMAGE}:previous"
  docker tag "${IMAGE}:latest" "${IMAGE}:rollback-${STAMP}"
  HAVE_PREV_IMAGE=1
  log "tagged rollback image ${IMAGE}:rollback-${STAMP}"
else
  log "WARN: no ${IMAGE}:latest present — image rollback will be unavailable this run"
fi

# ---------------------------------------------------------------------------
# 2. Update source. Tracked files only; server-only files are untouched.
# ---------------------------------------------------------------------------
log "fetching origin/$GIT_REF"
git -C "$SRC_DIR" fetch --prune origin "$GIT_REF"
git -C "$SRC_DIR" reset --hard "origin/${GIT_REF}"
NEW_SHA="$(git -C "$SRC_DIR" rev-parse HEAD)"
log "checked out: $NEW_SHA"

if [ -n "${TARGET_SHA:-}" ] && [ "$NEW_SHA" != "$TARGET_SHA" ]; then
  log "WARN: HEAD ($NEW_SHA) != workflow sha ($TARGET_SHA) — branch moved mid-deploy"
fi

# Prove the reset preserved the server-only files rather than assuming it. A file
# that was present and is now gone means something wiped untracked files — that is
# unrecoverable here, so stop before building on top of it.
VANISHED=""
[ "$HAD_ENV" = 1 ]     && [ ! -f "$SRC_DIR/.env" ]    && VANISHED="$VANISHED .env"
[ "$HAD_PRIVATE" = 1 ] && [ ! -d "$SRC_DIR/private" ] && VANISHED="$VANISHED private/"
if [ -n "$VANISHED" ]; then
  echo "FATAL: server-only files disappeared after git reset:$VANISHED"
  echo "       untracked files were wiped — restore them before deploying again"
  git -C "$SRC_DIR" reset --hard "$PREV_SHA"
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Build. The running container is untouched throughout this step.
# ---------------------------------------------------------------------------
# build.env supplies the build.args interpolation in docker-compose.yml. compose
# interpolates ${VAR} from the PROCESS environment, not from a service's own
# `environment:` block — which is why this file exists separately.
set -a
# shellcheck disable=SC1091
. "$APP_DIR/build.env"
set +a

# Hard pin regardless of what build.env says: Payload must never auto-alter schema.
export PAYLOAD_DB_PUSH=false

cd "$APP_DIR"
log "building image (old container still serving traffic)"
if ! docker compose build --pull "$SERVICE"; then
  log "BUILD FAILED — no restart performed, live container untouched"
  git -C "$SRC_DIR" reset --hard "$PREV_SHA"
  exit 1
fi

# ---------------------------------------------------------------------------
# 4. Swap. --no-build guarantees we ship exactly the image just verified above.
# ---------------------------------------------------------------------------
log "starting new container"
docker compose up -d --no-build "$SERVICE"

# ---------------------------------------------------------------------------
# 5. Health gate, with automatic rollback.
# ---------------------------------------------------------------------------
log "waiting for health at ${HEALTH_PATH} (up to 3 minutes)"
if ! wait_healthy 36; then
  log "HEALTHCHECK FAILED — rolling back"
  docker logs --tail 300 "$CONTAINER" 2>&1 || true

  git -C "$SRC_DIR" reset --hard "$PREV_SHA"

  if [ "$HAVE_PREV_IMAGE" -eq 1 ]; then
    docker tag "${IMAGE}:previous" "${IMAGE}:latest"
    docker compose up -d --no-build --force-recreate "$SERVICE"
    if wait_healthy 24; then
      log "ROLLBACK OK — serving previous commit $PREV_SHA"
    else
      log "!!! ROLLBACK UNHEALTHY — MANUAL INTERVENTION REQUIRED !!!"
    fi
  else
    log "!!! NO ROLLBACK IMAGE AVAILABLE — MANUAL INTERVENTION REQUIRED !!!"
  fi
  exit 1
fi

# ---------------------------------------------------------------------------
# 6. Post-deploy invariants — assert nothing was mutated.
# ---------------------------------------------------------------------------
docker volume inspect "$UPLOADS_VOLUME" >/dev/null 2>&1 \
  || { echo "FATAL: uploads volume disappeared during deploy"; exit 1; }

RUNTIME_PUSH="$(docker exec "$CONTAINER" printenv PAYLOAD_DB_PUSH 2>/dev/null || echo unset)"
if [ "$RUNTIME_PUSH" = "true" ]; then  # guard-ok: this assertion FAILS on the forbidden value
  echo "FATAL: container is running with schema auto-push enabled — it can alter the live schema"
  exit 1
fi

log "DEPLOYED $NEW_SHA — healthy"

# Dangling (untagged) layers only. No -a, no --volumes: tagged images including
# :previous and the rollback snapshots must survive.
docker image prune -f >/dev/null 2>&1 || true
