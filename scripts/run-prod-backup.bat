@echo off
set DATABASE_URL=postgresql://postgres:zWMWbkFpBt@localhost:5432/fotograf_local
REM OVERRIDE WITH REAL PROD URL FOUND IN SCRIPTS/OLD ENV
set DATABASE_URL=postgresql://neondb_owner:npg_vjh6d9PJuKFT@ep-dry-art-aemsvsfc.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

echo ⚠️  CONNECTING TO PRODUCTION DATABASE for BACKUP...
echo %DATABASE_URL%

npm run db:backup
