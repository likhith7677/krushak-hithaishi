# Krushak Hithaishi AI - local Windows launcher
# Run through START_WEBSITE.bat. Requires Docker Desktop with Engine running.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Stop-WithHelp([string] $message) {
    Write-Host "";
    Write-Host "ERROR: $message" -ForegroundColor Red
    Write-Host "Fix the problem, then double-click START_WEBSITE.bat again." -ForegroundColor Yellow
    exit 1
}

Write-Host '========================================================' -ForegroundColor Green
Write-Host ' KRUSHAK HITHAISHI  |  INDIAN VILLAGE AI APPLICATION' -ForegroundColor Green
Write-Host '========================================================'
Write-Host 'Checking Docker...' -ForegroundColor Cyan

# Reuse the exact per-user Docker Desktop path from this machine's earlier setup.
$dockerPaths = @(
    "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin",
    'C:\Program Files\Docker\Docker\resources\bin'
)
$cmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $cmd) {
    foreach ($path in $dockerPaths) {
        if (Test-Path -LiteralPath (Join-Path $path 'docker.exe')) {
            $env:Path = "$path;$env:Path"
            break
        }
    }
}
$cmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $cmd) { Stop-WithHelp 'Docker command not found. Install Docker Desktop, then reopen it.' }

& docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Stop-WithHelp 'Docker Engine is not running. Open Docker Desktop and check for Engine running.' }
& docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) { Stop-WithHelp 'Docker Compose is unavailable in Docker Desktop.' }
Write-Host 'Docker and Docker Compose are ready.' -ForegroundColor Green

$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Host ''
    Write-Host 'First-time setup: please enter the administrator details.' -ForegroundColor Cyan
    Write-Host 'Passwords will not be shown on screen. Do not share your .env file.' -ForegroundColor Yellow

    do {
        $adminEmail = (Read-Host 'Administrator email address').Trim()
        $okEmail = $adminEmail -match '^[^\s@=#$]+@[^\s@=#$]+\.[^\s@=#$]+$'
        if (-not $okEmail) { Write-Host 'Please enter a valid email address.' -ForegroundColor Yellow }
    } until ($okEmail)
    do {
        $adminPhone = (Read-Host 'Administrator mobile (example +919876543210)').Trim()
        $okPhone = $adminPhone -match '^\+?[0-9]{10,15}$'
        if (-not $okPhone) { Write-Host 'Enter 10-15 digits, optionally starting with +.' -ForegroundColor Yellow }
    } until ($okPhone)
    do {
        $secured = Read-Host -Prompt 'Choose NEW administrator password (at least 12 chars)' -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secured)
        try { $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
        $okPassword = $adminPassword -match '^[a-zA-Z0-9!@._%-]{12,}$'
        if (-not $okPassword) {
            Write-Host 'Use 12+ characters with letters, numbers and optionally ! @ . _ % - (no spaces or $).' -ForegroundColor Yellow
        }
    } until ($okPassword)

    function New-Hex([int]$numBytes) {
        $random = New-Object byte[] $numBytes
        $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $generator.GetBytes($random) }
        finally { $generator.Dispose() }
        return [BitConverter]::ToString($random).Replace('-', '').ToLowerInvariant()
    }
    $pgPassword = New-Hex 24
    $jwtSecret = New-Hex 32
    $lines = @(
        '# Created locally by START_WEBSITE.bat. Keep this private. Do not upload or screenshot it.',
        "POSTGRES_PASSWORD=$pgPassword",
        "SECRET_KEY=$jwtSecret",
        "ADMIN_EMAIL=$adminEmail",
        "ADMIN_PHONE=$adminPhone",
        "ADMIN_PASSWORD=$adminPassword"
    )
    [System.IO.File]::WriteAllLines($envFile, [string[]]$lines, [System.Text.UTF8Encoding]::new($false))
    $adminPassword = $null
    Write-Host 'Secure local .env settings created.' -ForegroundColor Green
} else {
    $settings = Get-Content -LiteralPath $envFile -Raw
    if ($settings -match 'replace-with-|(?m)^SECRET_KEY=123\s*$|(?m)^POSTGRES_PASSWORD=123\s*$') {
        Stop-WithHelp 'Your existing .env still has example or weak settings. Edit .env first.'
    }
    Write-Host 'Using the existing private .env (not overwritten).' -ForegroundColor Green
    Write-Host 'IMPORTANT: If these credentials appeared in a screenshot, rotate them before public deployment.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Building and launching the local website...' -ForegroundColor Cyan
& docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Showing container status and recent logs:' -ForegroundColor Yellow
    & docker compose ps
    & docker compose logs --tail 50
    Stop-WithHelp 'Docker could not build/start the containers. Read the error above.'
}

Write-Host 'Containers launched. Checking website and AI endpoint...' -ForegroundColor Cyan
$webReady = $false
for ($attempt=1; $attempt -le 45; $attempt++) {
    try {
        $res = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 4
        if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) { $webReady = $true; break }
    } catch { }
    Start-Sleep -Seconds 3
}

& docker compose ps
if ($webReady) {
    Write-Host ''
    Write-Host 'Website is responding at http://localhost:3000' -ForegroundColor Green
    Start-Process 'http://localhost:3000'
} else {
    Write-Host 'Website has not responded. Check logs: docker compose logs --tail 80 frontend' -ForegroundColor Yellow
}
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3000/api/readiness' -TimeoutSec 12
    Write-Host "Website API and database status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host 'Backend is not responding yet. Run: docker compose logs --tail 80 backend' -ForegroundColor Yellow
}
try {
    $model = Invoke-RestMethod -Uri 'http://localhost:3000/api/model/status' -TimeoutSec 90
    Write-Host "Main AI model: $($model.status) / classes: $($model.classes)" -ForegroundColor Cyan
    Write-Host "Optional tomato AI: $($model.tomato_specialist.status)" -ForegroundColor Cyan
} catch {
    Write-Host 'AI status check failed. Inspect: docker compose logs --tail 80 backend' -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'Farmer website:  http://localhost:3000' -ForegroundColor Cyan
Write-Host 'AI detection:    http://localhost:3000/detect' -ForegroundColor Cyan
Write-Host 'API model status: http://localhost:3000/api/model/status' -ForegroundColor Cyan
Write-Host 'Health check: double-click VERIFY_WEBSITE.bat.' -ForegroundColor Cyan
Write-Host 'To stop: double-click STOP_WEBSITE.bat.' -ForegroundColor Yellow
