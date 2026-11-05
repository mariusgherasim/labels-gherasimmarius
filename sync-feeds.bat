@echo off
cd /d "%~dp0"
echo Pune fisierele .xml in folderul feeds\ inainte de rulare.
echo Petmart: descarc feedul si il transform in format 2Performant...
node scripts\petmart-merchant-to-xml.cjs
node scripts\sync-feeds.cjs
pause
