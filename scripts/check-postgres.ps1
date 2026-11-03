param([string]$PgBin = "", [string]$Uv = "")
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $PgBin) { $PgBin = Join-Path $projectRoot '.tools/postgres/pgsql/bin' }
if (-not (Test-Path -LiteralPath (Join-Path $PgBin 'initdb.exe'))) { throw 'Specify -PgBin pointing to official PostgreSQL 18 binaries.' }
if (-not $Uv) {
    $localUv = Join-Path $projectRoot '.tools/uv/bin/uv.exe'
    $Uv = if (Test-Path -LiteralPath $localUv) { $localUv } else { (Get-Command uv -ErrorAction Stop).Source }
}
$pgPort = 55433
if (Get-NetTCPConnection -LocalPort $pgPort -State Listen -ErrorAction SilentlyContinue) { throw 'Verification port 55433 is occupied.' }
$pgCheckRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('avitopulse-postgres-check-' + [guid]::NewGuid().ToString('N'))
$pgData = Join-Path $pgCheckRoot 'data'
$pwFile = Join-Path $pgCheckRoot 'init-password'
New-Item -ItemType Directory -Force $pgCheckRoot | Out-Null
# PostgreSQL's Windows bootstrap cannot safely embed a Cyrillic executable path in SQL.
# Invoke the same binaries through an ASCII junction; do not modify the system install.
$pgJunction = Join-Path $pgCheckRoot 'pgsql'
New-Item -ItemType Junction -Path $pgJunction -Target (Split-Path -Parent $PgBin) | Out-Null
$PgBin = Join-Path $pgJunction 'bin'
$started = $false
$savedEnvironment = @{}
Push-Location $projectRoot
try {
    node scripts/init-local.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Local environment setup failed' }
    foreach ($line in Get-Content -LiteralPath .env) {
        if ($line -match '^([A-Z_]+)=(.*)$') {
            $key = $Matches[1]
            $savedEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
            [Environment]::SetEnvironmentVariable($key, $Matches[2], 'Process')
        }
    }
    foreach ($key in @('PGPASSWORD', 'AVITOPULSE_TEST_DATABASE_URL', 'AVITOPULSE_MIGRATION_DATABASE_URL')) {
        if (-not $savedEnvironment.ContainsKey($key)) { $savedEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    }
    [System.IO.File]::WriteAllText($pwFile, $env:POSTGRES_PASSWORD)
    & (Join-Path $PgBin 'initdb.exe') -D $pgData --username=postgres --auth=scram-sha-256 --locale=C --encoding=UTF8 "--pwfile=$pwFile"
    if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
    [System.IO.File]::Delete($pwFile)
    $startArgs = @('-D', ('"' + $pgData + '"'), '-l', ('"' + (Join-Path $pgCheckRoot 'postgres.log') + '"'), '-o', ('"-h 127.0.0.1 -p ' + $pgPort + '"'), '-w', 'start')
    $starter = Start-Process -FilePath (Join-Path $PgBin 'pg_ctl.exe') -ArgumentList $startArgs -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $pgCheckRoot 'start.log') -RedirectStandardError (Join-Path $pgCheckRoot 'start-error.log')
    # Start-Process -Wait waits for the server's entire process tree on Windows.
    if (-not $starter.WaitForExit(30000)) { throw 'pg_ctl did not finish within 30 seconds' }
    if ($starter.ExitCode -ne 0) { throw 'PostgreSQL start failed; see local start logs' }
    $started = $true
    $env:PGPASSWORD = $env:POSTGRES_PASSWORD
    & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p $pgPort -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE avitopulse'
    if ($LASTEXITCODE -ne 0) { throw 'Database creation failed' }
    & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p $pgPort -U postgres -d avitopulse -v ON_ERROR_STOP=1 -f infra/postgres/bootstrap.sql
    if ($LASTEXITCODE -ne 0) { throw 'Role bootstrap failed' }
    $env:AVITOPULSE_TEST_DATABASE_URL = $env:AVITOPULSE_TEST_DATABASE_URL.Replace(':55432/', ':55433/')
    $env:AVITOPULSE_MIGRATION_DATABASE_URL = $env:AVITOPULSE_MIGRATION_DATABASE_URL.Replace(':55432/', ':55433/')
    Push-Location backend
    try {
        & $Uv run --frozen alembic upgrade head
        if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
        & $Uv run --frozen alembic upgrade head
        if ($LASTEXITCODE -ne 0) { throw 'Repeated migration failed' }
        & $Uv run --frozen pytest
        if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL tests failed' }
    } finally { Pop-Location }
    Write-Output 'Real PostgreSQL bootstrap, migrations and tests passed.'
} finally {
    if (Test-Path -LiteralPath $pwFile) { [System.IO.File]::Delete($pwFile) }
    if ($started) {
        $stopper = Start-Process -FilePath (Join-Path $PgBin 'pg_ctl.exe') -ArgumentList @('-D', ('"' + $pgData + '"'), '-m', 'fast', '-w', 'stop') -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $pgCheckRoot 'stop.log') -RedirectStandardError (Join-Path $pgCheckRoot 'stop-error.log')
        if ($stopper.ExitCode -ne 0) { Write-Warning 'Verification PostgreSQL did not stop; check local logs.' }
    }
    foreach ($key in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key, $savedEnvironment[$key], 'Process') }
    Pop-Location
}
