#!/usr/bin/env bash
# Rebuild the local production image from the current working tree and restart it.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "[deploy-local] building web/dist"
(cd web && bun run build)

echo "[deploy-local] building image and restarting container"
docker compose up -d --build app

echo "[deploy-local] done: http://127.0.0.1:3300"
