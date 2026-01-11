@echo off
echo ===================================================
echo   BEZPIECZNA NAPRAWA BAZY (SURGICAL PATCH)
echo ===================================================
echo.
echo To narzedzie naprawi brakujace tabele (Historia) i kolumny (Theme).
echo Omija problem "Schema not empty".
echo.
REM Przejdz do katalogu glownego projektu (gdzie jest package.json i prisma)
cd /d "%~dp0.."

set /p PROD_URL="Wklej tutaj swoj adres bazy danych (zaczynajacy sie od postgres://): "
echo.
echo Ustawiam adres bazy...
REM Uzywamy cudzyslowow, zeby obsluzyc znak & w URL
set "DATABASE_URL=%PROD_URL%"

echo.
echo Uruchamiam naprawe...
call node scripts/patch_prod.js

echo.
echo ===================================================
echo   Jesli widzisz SUCCESS, to wszystko dziala!
echo ===================================================
pause
