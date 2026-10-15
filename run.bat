@echo off
title Alabama Bot 24/7 Supervisor
cd /d "%~dp0"
echo ==============================================
echo   ALABAMA STATE ROLEPLAY - 24/7 BOT SUPERVISOR
echo ==============================================
echo.
echo Stopping any lingering bot processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:loop
echo [%date% %time%] Starting 24/7 Supervisor...
node run.js
echo.
echo [%date% %time%] WARNING: Supervisor process stopped! Restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto loop