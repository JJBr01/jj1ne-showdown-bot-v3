@echo off
cd /d "%~dp0"
if exist STOP del STOP
set N=%1
if "%N%"=="" set /p N=How many battles should it play? (number, 0 = unlimited, Enter = use config.json): 
node bot.js %N%
pause
