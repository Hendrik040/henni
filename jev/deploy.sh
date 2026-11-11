#!/usr/bin/env bash
# Deploy Henni's Jev proxy (jev/jev-proxy.mjs + guests/merge-guests.json) to a Railway service.
#   RAILWAY_PROJECT=<project id> bash jev/deploy.sh
# Optional: RAILWAY_SERVICE (default jev-proxy), RAILWAY_ENV_NAME (default production).
# TYPESAFE_API_KEY lives in the service's Railway variables; this only uploads the code.
# Optional variables there: JEV_DAILY_CAP (real Jev calls per UTC day, default 25000), JEV_MODEL, JEV_ORIGINS.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${RAILWAY_PROJECT:?set RAILWAY_PROJECT to your Railway project id}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/jev" "$STAGE/guests"
cp "$ROOT/jev/jev-proxy.mjs" "$STAGE/jev/"
cp "$ROOT/guests/merge-guests.json" "$STAGE/guests/"
cat > "$STAGE/package.json" <<'JSON'
{
  "name": "henni-jev-proxy",
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": { "start": "node jev/jev-proxy.mjs" }
}
JSON
railway up "$STAGE" --path-as-root --project "$RAILWAY_PROJECT" --service "${RAILWAY_SERVICE:-jev-proxy}" \
  --environment "${RAILWAY_ENV_NAME:-production}" --detach "$@"
