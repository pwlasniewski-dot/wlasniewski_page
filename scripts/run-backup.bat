@echo off
:: Backup PRODUCTION Database on Startup (Zero Loss Protocol)
echo 🚀 Starting Automatic PRODUCTION Database Backup...
echo ⚠️  CONNECTING TO PRODUCTION (Neon)...

if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL is not configured.
    exit /b 1
)
cd /d "C:\Strona-fotografa"
call npm run db:backup

if %errorlevel% neq 0 (
    echo ❌ Backup Failed!
    pause
    exit /b %errorlevel%
)
echo ✅ Production Backup Completed Successfully.
timeout /t 5
