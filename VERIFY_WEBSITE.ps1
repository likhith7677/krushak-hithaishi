# Run after START_WEBSITE.bat to check the real website -> API connection.
$ErrorActionPreference='Continue'
Set-Location -LiteralPath $PSScriptRoot
$dockerPath = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin'
if (Test-Path (Join-Path $dockerPath 'docker.exe')) { $env:Path = "$dockerPath;$env:Path" }
Write-Host '=== KRUSHAK HITHAISHI LOCAL HEALTH CHECK ===' -ForegroundColor Green
Write-Host 'Checking containers...' -ForegroundColor Cyan
& docker compose ps
foreach ($p in @('http://localhost:3000','http://localhost:3000/api/health','http://localhost:3000/api/readiness','http://localhost:3000/api/model/status','http://localhost:3000/api/shops/nearby')) {
  try {
    $r=Invoke-WebRequest -UseBasicParsing -Uri $p -TimeoutSec 60
    Write-Host "OK  $($r.StatusCode)  $p" -ForegroundColor Green
    if ($p -like '*/api/model/status') {
      $model=$r.Content|ConvertFrom-Json
      Write-Host "    Main AI: $($model.status) - $($model.classes) classes" -ForegroundColor Cyan
      Write-Host "    Tomato specialist: $($model.tomato_specialist.status)" -ForegroundColor Cyan
    }
  } catch {
    Write-Host "FAILED  $p" -ForegroundColor Red
    Write-Host "        $($_.Exception.Message)" -ForegroundColor Yellow
  }
}
Write-Host 'If a check fails, run: docker compose logs --tail 100' -ForegroundColor Yellow
