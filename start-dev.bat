@echo off
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
cd /d "%~dp0"
echo Starting WorkFlow Vite Server...
"%LOCALAPPDATA%\Programs\nodejs\npx.cmd" vite --host 0.0.0.0 --port 5173
pause
