@echo off
cd /d "%~dp0"
echo Pune fisierele .xml in folderul feeds\ inainte de rulare.
node scripts\sync-feeds.cjs
pause
