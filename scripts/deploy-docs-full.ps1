# Deploy completo — docs.lebytek.com (docsV2)
# Uso desde la raíz del repo:
#   .\scripts\deploy-docs-full.ps1
#
# Requisitos:
#   - SSH alias "lebytek-vps" configurado (~/.ssh/config)
#   - Cambios commiteados en main antes de ejecutar (este script hace push)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host "==> Verificando rama main..." -ForegroundColor Cyan
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") {
    throw "Debes estar en la rama main (actual: $branch)."
}

$ahead = git rev-list --count origin/main..HEAD 2>$null
if ($ahead -eq $null) { $ahead = 0 }
if ($ahead -eq 0) {
    $dirty = git status --porcelain
    if ($dirty) {
        Write-Warning "Hay cambios sin commitear. Haz commit antes del deploy."
        git status -sb
        exit 1
    }
    Write-Host "No hay commits locales pendientes de push." -ForegroundColor Yellow
} else {
    Write-Host "==> git push origin main ($ahead commit(s))..." -ForegroundColor Cyan
    git push origin main
}

Write-Host "==> Deploy en VPS (pull + build + rsync)..." -ForegroundColor Cyan
ssh lebytek-vps @"
sudo -u lebytek-docs bash -lc '
  set -euo pipefail
  source ~/.nvm/nvm.sh
  cd ~/repo/docsV2
  git pull origin main
  npm ci
  npm run build
  rsync -a --delete dist/ ~/htdocs/docs.lebytek.com/
  echo Deploy OK -> https://docs.lebytek.com
'
"@

Write-Host "==> Listo: https://docs.lebytek.com" -ForegroundColor Green
