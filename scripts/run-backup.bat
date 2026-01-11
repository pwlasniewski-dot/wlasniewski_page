@echo off
:: Backup Database on Startup
echo 🚀 Starting Automatic Database Backup (Zero Loss Protocol)...
cd /d "C:\Strona-fotografa"
call npm run db:backup
if %errorlevel% neq 0 (
    echo ❌ Backup Failed!
    pause
    exit /b %errorlevel%
)
echo ✅ Backup Completed Successfully.
timeout /t 5
