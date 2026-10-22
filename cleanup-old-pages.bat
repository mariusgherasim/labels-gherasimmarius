@echo off
cd /d "%~dp0"
echo Sterg paginile vechi LabelShop (inlocuite de structura noua)...
rmdir /s /q "src\pages\etichete" 2>nul
rmdir /s /q "src\pages\echipamente" 2>nul
rmdir /s /q "src\pages\ambalare" 2>nul
rmdir /s /q "src\pages\consumabile" 2>nul
del /q "src\pages\promotii\index.astro" 2>nul
del /q "src\pages\promotii\[page].astro" 2>nul
del /q "scripts\import-feed.cjs" 2>nul
echo Gata. Ruleaza acum: npm install, apoi npm run build
pause
