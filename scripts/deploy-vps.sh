#!/usr/bin/env bash
set -euo pipefail

REMOTE="${DOCS_VPS_HOST:-lebytek-vps}"
REMOTE_PATH="/home/lebytek-docs/htdocs/docs.lebytek.com"

npm run build
rsync -avz --delete dist/ "${REMOTE}:${REMOTE_PATH}/"
echo "Deploy OK → https://docs.lebytek.com"
