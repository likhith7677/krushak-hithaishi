@echo off
cd /d "%~dp0"
set "DOCKER_BIN=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin"
if exist "%DOCKER_BIN%\docker.exe" set "PATH=%DOCKER_BIN%;%PATH%"
if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" set "PATH=C:\Program Files\Docker\Docker\resources\bin;%PATH%"
docker compose down
echo Your database data is preserved.
pause
