@echo off
cd /d "%~dp0"
node generate-email.cjs
echo.
echo Deschide email-output.html in browser.
start "" "email-output.html"
pause
