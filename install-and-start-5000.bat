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

echo [1/4] Node version:
node --version
call npm --version

echo.
echo [2/4] Installing/updating project dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo [3/4] Starting development server on port 5000...
start "Welfare Equipment Site :5000" cmd /k "cd /d ""%~dp0"" && npm run dev:5000"

echo [4/4] Waiting for the server and opening the browser...
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
