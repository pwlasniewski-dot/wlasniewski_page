@echo off
:: Backup PRODUCTION Database on Startup (Zero Loss Protocol)
echo 🚀 Starting Automatic PRODUCTION Database Backup...
echo ⚠️  CONNECTING TO PRODUCTION (Neon)...

:: Set PRODUCTION database URL
set DATABASE_URL=postgresql://neondb_owner:npg_vjh6d9PJuKFT@ep-dry-art-aemsvsfc.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require^&sslmode=require

cd /d "C:\Strona-fotografa"
call npm run db:backup

if %errorlevel% neq 0 (
    echo ❌ Backup Failed!
    pause
    exit /b %errorlevel%
)
echo ✅ Production Backup Completed Successfully.
timeout /t 5
