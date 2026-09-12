@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo  Welfare Equipment Site - Local Port 5000
echo ==============================================

echo.
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Install Node.js 22 LTS, then run this file again.
  echo https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not available.
  pause
  exit /b 1
)

echo [1/3] Installing/updating dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo [2/3] Starting Next.js on http://localhost:5000 ...
start "Welfare Equipment Site :5000" cmd /k "cd /d ""%~dp0"" && npm run dev:5000"

echo [3/3] Opening browser...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5000"

echo.
echo Server window opened. Keep that window running while you review the site.
echo Local URL: http://localhost:5000
echo Same-WiFi devices can use this PC's LAN IP with :5000 if Windows Firewall allows it.
echo.
pause
