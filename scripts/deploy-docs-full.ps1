# Deploy completo ÔÇö docs.lebytek.com (docsV2)
# Uso desde la ra├¡z del repo:
#   .\scripts\deploy-docs-full.ps1
#
# Requisitos:
#   - SSH alias "lebytek-vps" configurado (~/.ssh/config)
#   - Cambios commiteados en main antes del deploy (o usar el flujo interactivo)

$ErrorActionPreference = "Stop"

function Get-GitPendingFiles {
    $lines = git status --porcelain 2>$null
    if (-not $lines) { return @() }

    $items = @()
    $i = 1
    foreach ($line in $lines) {
        if ($line.Length -lt 4) { continue }
        $indexStatus = $line.Substring(0, 1)
        $workStatus = $line.Substring(1, 1)
        $path = $line.Substring(3).Trim('"')

        $labels = @()
        if ($indexStatus -ne ' ' -and $indexStatus -ne '?') {
            switch ($indexStatus) {
                'A' { $labels += 'staged (nuevo)' }
                'M' { $labels += 'staged (modificado)' }
                'D' { $labels += 'staged (eliminado)' }
                'R' { $labels += 'staged (renombrado)' }
                default { $labels += "staged ($indexStatus)" }
            }
        }
        if ($workStatus -ne ' ' -and $workStatus -ne '?') {
            switch ($workStatus) {
                'M' { $labels += 'sin stage (modificado)' }
                'D' { $labels += 'sin stage (eliminado)' }
                default { $labels += "sin stage ($workStatus)" }
            }
        }
        if ($indexStatus -eq '?' -and $workStatus -eq '?') {
            $labels += 'sin trackear'
        }
        if ($labels.Count -eq 0) { $labels += 'cambio' }

        $items += [PSCustomObject]@{
            Number = $i
            Path   = $path
            Label  = ($labels -join ', ')
        }
        $i++
    }
    return $items
}

function Show-PendingFiles {
    param([array]$Items)

    Write-Host ""
    Write-Host "Archivos pendientes:" -ForegroundColor Yellow
    foreach ($item in $Items) {
        Write-Host ("  [{0}] {1,-40} {2}" -f $item.Number, $item.Path, $item.Label)
    }
    Write-Host ""
}

function Invoke-InteractiveCommit {
    param([array]$Items)

    Show-PendingFiles -Items $Items

    Write-Host "Como quieres agregar archivos al commit?" -ForegroundColor Cyan
    Write-Host "  a = todos (git add .)"
    Write-Host "  n = seleccionar por numero (ej: 1,3,5)"
    Write-Host "  q = cancelar deploy"
    $choice = (Read-Host "Opcion").Trim().ToLowerInvariant()

    switch ($choice) {
        'a' {
            git add .
        }
        'n' {
            $raw = Read-Host "Numeros a incluir (separados por coma)"
            $nums = $raw -split '[,\s]+' | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ }
            if (-not $nums -or $nums.Count -eq 0) {
                throw "No seleccionaste ningun archivo valido."
            }
            $selected = @()
            foreach ($n in $nums) {
                $match = $Items | Where-Object { $_.Number -eq $n }
                if (-not $match) {
                    throw "Numero invalido: $n"
                }
                $selected += $match.Path
            }
            foreach ($path in ($selected | Select-Object -Unique)) {
                git add -- "$path"
            }
            Write-Host "Agregados: $($selected -join ', ')" -ForegroundColor DarkGray
        }
        'q' {
            Write-Host "Deploy cancelado." -ForegroundColor Yellow
            exit 0
        }
        default {
            throw "Opcion invalida. Usa a, n o q."
        }
    }

    $staged = git diff --cached --name-only
    if (-not $staged) {
        throw "No hay archivos en stage despues de git add."
    }

    Write-Host ""
    Write-Host "En stage para commit:" -ForegroundColor Cyan
    $staged | ForEach-Object { Write-Host "  - $_" }

    $message = Read-Host "Mensaje de commit"
    if ([string]::IsNullOrWhiteSpace($message)) {
        throw "El mensaje de commit no puede estar vacio."
    }

    git commit -m $message
    Write-Host "Commit creado." -ForegroundColor Green
}

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host "==> Verificando rama main..." -ForegroundColor Cyan
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") {
    throw "Debes estar en la rama main (actual: $branch)."
}

$pending = Get-GitPendingFiles
if ($pending.Count -gt 0) {
    Write-Host "==> Hay cambios sin commitear." -ForegroundColor Cyan
    Invoke-InteractiveCommit -Items $pending
}

$ahead = git rev-list --count origin/main..HEAD 2>$null
if ($null -eq $ahead) { $ahead = 0 }

if ($ahead -gt 0) {
    Write-Host "==> git push origin main ($ahead commit(s))..." -ForegroundColor Cyan
    git push origin main
} else {
    Write-Host "No hay commits locales pendientes de push." -ForegroundColor Yellow
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
