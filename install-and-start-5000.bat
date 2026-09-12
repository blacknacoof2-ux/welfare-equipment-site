@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ==================================================
echo  Welfare Equipment Site - Install + Start :5000
echo ==================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [INFO] Node.js not found. Trying automatic Node.js LTS install...
  where winget >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] winget is not available.
    echo Install Node.js LTS from https://nodejs.org/ and run this file again.
    pause
    exit /b 1
  )

  winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
  if errorlevel 1 (
    echo [ERROR] Automatic Node.js installation failed.
    pause
    exit /b 1
  )

  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

where npm >nul 2>&1
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
  ) else (
    echo [ERROR] npm not found after Node.js installation.
    echo Close this window and run this file once more.
    pause
    exit /b 1
  )
)

echo [1/5] Node version:
node --version
call npm --version

echo.
echo [2/5] Installing/updating project dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo [3/5] Checking port 5000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=(Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess); if($p){$proc=Get-Process -Id $p -ErrorAction SilentlyContinue; if($proc -and $proc.ProcessName -eq 'node'){Write-Host ('[INFO] Stopping existing Node server PID ' + $p + ' on port 5000...'); Stop-Process -Id $p -Force; Start-Sleep -Seconds 1}else{Write-Host ('[ERROR] Port 5000 is used by a non-Node process. PID=' + $p); exit 2}}"
if errorlevel 2 (
  echo [ERROR] Port 5000 is occupied by another program. Close it manually and try again.
  pause
  exit /b 2
)

echo.
echo [4/5] Starting development server on port 5000...
start "Welfare Equipment Site :5000" cmd /k "cd /d ""%~dp0"" && npm run dev:5000"

echo [5/5] Waiting for the server and opening the browser...
timeout /t 6 /nobreak >nul
start "" "http://localhost:5000"

echo.
echo ==================================================
echo  READY: http://localhost:5000
echo ==================================================
echo Keep the separate server window open while reviewing the site.
echo To stop the server, click the server window and press Ctrl+C.
echo.
pause
