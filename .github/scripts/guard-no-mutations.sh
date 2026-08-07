#!/usr/bin/env bash
#
# Zero-mutation policy guard.
#
# The deploy pipeline targets a LIVE, SHARED Postgres database and a docker volume
# holding all Payload media uploads. The hard requirement is that CI/CD must never
# mutate either one. This script turns that requirement into a property of the repo
# rather than a promise: it fails CI if anything capable of mutation gets committed.
#
# Run from the repo root. Exits 1 on any violation.

set -uo pipefail

fail=0

violation() {
  printf '\n\033[31mPOLICY VIOLATION\033[0m: %s\n' "$1"
  fail=1
}

# Grep helper: prints matches, returns 0 only when something matched.
#
# Excludes this script — it necessarily contains every pattern it looks for — and
# any line carrying a `guard-ok` marker. The marker exists for the two legitimate
# cases: a comment *documenting* why something is banned, and an assertion that
# fails *when* a forbidden value is present. Use it sparingly and always with a
# reason on the same line.
GUARD_SELF="$(basename "${BASH_SOURCE[0]}")"
scan() {
  local pattern="$1"
  shift
  grep -rInE --exclude="$GUARD_SELF" "$pattern" "$@" 2>/dev/null | grep -v 'guard-ok'
}

echo "== zero-mutation policy guard =="

# 1. Destructive docker verbs. `down -v` / `volume rm` delete the uploads volume;
#    `prune -a` / `prune --volumes` can take out the rollback images and volumes.
if scan 'compose[^|]*(down)[^|]*(-v|--volumes)|docker[[:space:]]+volume[[:space:]]+rm|system[[:space:]]+prune[^|]*--volumes|image[[:space:]]+prune[^|]*[[:space:]]-a' .github/; then
  violation "destructive docker command in .github/ — this would delete the uploads volume or rollback images"
fi

# 2. Migrations must never run in the deploy path. They belong exclusively to
#    .github/workflows/migrate.yml, which takes a verified pg_dump first.
deploy_paths=()
for p in .github/scripts/remote-deploy.sh .github/workflows/deploy.yml .github/workflows/_deploy.yml .github/workflows/ci.yml; do
  [ -f "$p" ] && deploy_paths+=("$p")
done
if [ ${#deploy_paths[@]} -gt 0 ]; then
  if scan '(npm|pnpm|yarn)[[:space:]]+run[[:space:]]+migrate|payload[[:space:]]+migrate' "${deploy_paths[@]}"; then
    violation "migrate invocation in the deploy path — migrations are manual-only (see .github/workflows/migrate.yml)"
  fi
fi

# 3. Dockerfile must not migrate on build. A build pointed at the live DATABASE_URL
#    would migrate production on every single push.
if [ -f Dockerfile ] && scan 'RUN_MIGRATIONS_ON_BUILD[[:space:]]*=[[:space:]]*"?true' Dockerfile; then
  violation "Dockerfile sets RUN_MIGRATIONS_ON_BUILD=true — a build would mutate the live database"
fi

# 4. Payload schema auto-push would let the app ALTER the live schema at boot.
push_paths=(.github/)
[ -f Dockerfile ] && push_paths+=(Dockerfile)
[ -f .env.example ] && push_paths+=(.env.example)
if scan 'PAYLOAD_DB_PUSH[[:space:]]*[=:][[:space:]]*.?true' "${push_paths[@]}"; then
  violation "PAYLOAD_DB_PUSH=true found — Payload would auto-alter the live schema on boot"
fi

# 5. `git clean` would delete the server's untracked-but-essential files:
#    .env, private/secrets/*.json (Google service account), public/media/.
#    `git reset --hard` is fine — it only rewrites tracked files.
if scan 'git[[:space:]]+clean' .github/; then
  violation "git clean in .github/ — would destroy the server's .env, private/ credentials and media"
fi

# 6. The seed route rewrites all CMS content. Nothing in CI should ever call it.
if scan 'next/seed' .github/; then
  violation "reference to the seed route in .github/ — seeding rewrites live CMS content"
fi

if [ "$fail" -eq 0 ]; then
  echo "OK — no mutation hazards found"
fi

exit "$fail"
