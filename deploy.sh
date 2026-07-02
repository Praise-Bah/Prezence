#!/usr/bin/env bash
#
# Prezence VPS deploy — pull latest, rebuild, restart the API with secrets
# injected from Doppler (nothing secret is written to disk permanently).
#
# One-time prereqs on the VPS (see DEPLOYMENT.md):
#   - docker + docker compose plugin
#   - doppler CLI
#   - a Doppler service token exported as DOPPLER_TOKEN (scoped to prezence/prd)
#
# Usage:   bash deploy.sh
#
set -euo pipefail

cd "$(dirname "$0")"

if [ -z "${DOPPLER_TOKEN:-}" ]; then
  echo "ERROR: DOPPLER_TOKEN is not set. Export your Doppler service token first." >&2
  echo "       export DOPPLER_TOKEN='dp.st.prd.xxxxxxxx'" >&2
  exit 1
fi

echo "==> Pulling latest from git (fast-forward only)..."
git pull --ff-only

echo "==> Building + starting containers (prd secrets mounted from Doppler)..."
# --mount writes an EPHEMERAL .env.production for the duration of this command
# (docker compose reads it as env_file), then Doppler deletes it automatically.
doppler run --mount .env.production --mount-format docker -- \
  docker compose up -d --build

echo "==> Pruning dangling images..."
docker image prune -f

echo "==> Status:"
docker compose ps
echo "==> Deploy complete."
