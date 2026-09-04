@echo off
set "PATH=%LOCALAPPDATA%\Programs\git\cmd;%LOCALAPPDATA%\Programs\git\mingw64\bin;%PATH%"
set "GCM_INTERACTIVE=always"
set "GCM_GUI=true"
cd /d "%~dp0"
echo ========================================================
echo Pushing WorkFlow to https://github.com/Raches-studio/workflow-app.git
echo Browser popup will appear for authentication...
echo ========================================================
git push -u origin main
echo.
echo Process complete.
pause
