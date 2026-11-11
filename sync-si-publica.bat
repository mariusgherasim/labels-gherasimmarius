@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo  Casa Atelier - actualizare produse + publicare
echo ============================================
echo.
if not exist "feeds\*.xml" (
  echo Nu am gasit niciun .xml in folderul feeds\
  echo Descarca feedurile din 2Performant si pune-le acolo.
  pause
  exit /b 1
)
echo [1/3] Sincronizez produsele din feeduri...
node scripts\sync-feeds.cjs
if errorlevel 1 (
  echo.
  echo EROARE la sincronizare. Nu public nimic.
  pause
  exit /b 1
)
echo.
echo [2/3] Verific ca site-ul se construieste...
call npm run build >build-log.txt 2>&1
if errorlevel 1 (
  echo EROARE la build. Detalii in build-log.txt. Nu public nimic.
  pause
  exit /b 1
)
del build-log.txt
echo Build OK.
echo.
echo [3/3] Public pe GitHub...
git add -A
git commit -m "chore: sync produse din feed %date%"
git pull -X ours --no-edit origin main
git push origin main
echo.
echo GATA. Site-ul se actualizeaza in 2-3 minute (vezi tab-ul Actions pe GitHub).
pause
