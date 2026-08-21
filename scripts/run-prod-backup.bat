@echo off
echo ⚠️  CONNECTING TO PRODUCTION DATABASE for BACKUP...
if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL is not configured.
  exit /b 1
)

npm run db:backup
