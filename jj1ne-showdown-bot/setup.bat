@echo off
REM One-time setup: downloads and builds the Showdown engine next to the bot (needs Git and Node.js 22+).
cd /d "%~dp0"
where git >nul 2>nul || (echo Git is not installed. Get it from https://git-scm.com/download/win & pause & exit /b 1)
where node >nul 2>nul || (echo Node.js is not installed. Get v22 LTS from https://nodejs.org & pause & exit /b 1)
if not exist ps (git clone --depth 1 https://github.com/smogon/pokemon-showdown.git ps)
cd ps
call npm install --omit=dev
call node build
cd ..
call npm install ws @smogon/calc --no-save
echo.
echo Setup complete. Edit config.json if needed, then double-click run.bat
pause
