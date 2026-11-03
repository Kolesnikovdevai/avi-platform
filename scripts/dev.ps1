param([string]$Uv = "")
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $Uv) {
    $localUv = Join-Path $projectRoot '.tools/uv/bin/uv.exe'
    $Uv = if (Test-Path -LiteralPath $localUv) { $localUv } else { (Get-Command uv -ErrorAction Stop).Source }
}
$apiProcess = $null
Push-Location $projectRoot
try {
    if (Get-NetTCPConnection -LocalPort 8000,3000 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 8000 or 3000 is occupied. Stop the existing process or run web/API separately.'
    }
    node scripts/init-local.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Local environment setup failed' }
    docker compose up -d --wait db
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not start. Check Docker Desktop.' }
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'Frontend installation failed' }
    Push-Location backend
    try {
        & $Uv sync --frozen
        if ($LASTEXITCODE -ne 0) { throw 'Backend installation failed' }
        & $Uv run --frozen --env-file ../.env alembic upgrade head
        if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
    } finally { Pop-Location }
    New-Item -ItemType Directory -Force .local | Out-Null
    $apiProcess = Start-Process -FilePath $Uv -ArgumentList @('run', '--frozen', '--env-file', ('"' + (Join-Path $projectRoot '.env') + '"'), 'avitopulse-api') -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot '.local/api.log') -RedirectStandardError (Join-Path $projectRoot '.local/api-error.log')
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try { $null = Invoke-RestMethod http://127.0.0.1:8000/api/health/ready -TimeoutSec 3; $ready = $true; break } catch { Start-Sleep -Seconds 1 }
    }
    if (-not $ready) { throw 'API readiness failed; see .local/api*.log' }
    Write-Host 'API ready: http://127.0.0.1:8000/api/health/ready'
    Write-Host 'Starting local demo: http://127.0.0.1:3000'
    pnpm dev
} finally {
    if ($apiProcess -and -not $apiProcess.HasExited) { taskkill /PID $apiProcess.Id /T /F | Out-Null }
    Pop-Location
}
