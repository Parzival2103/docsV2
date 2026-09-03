#!/usr/bin/env bash
# Deploy en el VPS — ejecutar como root o con sudo desde tu máquina:
#   ssh lebytek-vps 'bash -s' < scripts/deploy-docs-vps.sh
#
# O dentro del VPS (como lebytek-docs):
#   source ~/.nvm/nvm.sh && cd ~/repo/docsV2 && bash scripts/deploy-docs-vps.sh

set -euo pipefail

DOCS_USER="${DOCS_USER:-lebytek-docs}"
REPO_DIR="/home/${DOCS_USER}/repo/docsV2"
HTDOCS="/home/${DOCS_USER}/htdocs/docs.lebytek.com"

run_deploy() {
  set -euo pipefail
  source ~/.nvm/nvm.sh
  cd "${REPO_DIR}"
  git pull origin main
  npm ci
  npm run build
  rsync -a --delete dist/ "${HTDOCS}/"
  # Sanity: HTML/JS tester must ship create-instance preset (avoid stale browser cache of tester.js).
  if ! grep -q "instances_create" "${HTDOCS}/tester.js"; then
    echo "ERROR: ${HTDOCS}/tester.js missing instances_create after deploy" >&2
    exit 1
  fi
  if ! grep -q "tester.js?v=" "${HTDOCS}/tester.html"; then
    echo "WARN: ${HTDOCS}/tester.html missing tester.js cache-bust query" >&2
  fi
  echo "Deploy OK → https://docs.lebytek.com"
  echo "HTML/JS: open /#tester (hard refresh) or /tester.html — dropdown must include Instancias · Crear"
}

if [[ "$(id -un)" == "${DOCS_USER}" ]]; then
  run_deploy
elif [[ "$(id -un)" == "root" ]]; then
  sudo -u "${DOCS_USER}" bash -lc "$(declare -f run_deploy); run_deploy"
else
  echo "Ejecuta como root o como ${DOCS_USER}." >&2
  exit 1
fi
