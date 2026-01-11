@echo off
echo ===================================================
echo   NAPRAWA IMPORTU ZDJEC (BLAD 500)
echo ===================================================
echo.
echo To narzedzie naprawi problem "Duplicate Key" przy wgrywaniu zdjec.
echo.
REM Przejdz do katalogu glownego projektu
cd /d "%~dp0.."

set /p PROD_URL="Wklej adres bazy danych (ten sam co wczesniej): "
echo.
echo Ustawiam adres bazy...
set "DATABASE_URL=%PROD_URL%"

echo.
echo Uruchamiam naprawe sekwencji...
call node scripts/fix_sequence_prod.js

echo.
echo ===================================================
echo   GOTOWE! Sprobuj wgrac zdjecie teraz.
echo ===================================================
pause
