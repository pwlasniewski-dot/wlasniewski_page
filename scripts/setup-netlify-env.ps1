#!/usr/bin/env pwsh
# Skrypt do szybkiej konfiguracji zmiennych środowiskowych w Netlify
# Wymaga: Netlify CLI (npm install -g netlify-cli)
# Użycie: .\scripts\setup-netlify-env.ps1

Write-Host "=== Konfiguracja zmiennych środowiskowych Netlify ===" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy Netlify CLI jest zainstalowane
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlifyInstalled) {
    Write-Host "ERROR: Netlify CLI nie jest zainstalowane" -ForegroundColor Red
    Write-Host "Zainstaluj: npm install -g netlify-cli" -ForegroundColor Yellow
    exit 1
}

# Sprawdź czy plik .env istnieje
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: Plik .env nie został znaleziony" -ForegroundColor Red
    exit 1
}

Write-Host "Wczytywanie zmiennych z .env..." -ForegroundColor Yellow

# Wczytaj zmienne z .env
$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        $envVars[$key] = $value
    }
}

Write-Host "Znalezione zmienne:" -ForegroundColor Green
$envVars.Keys | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

# Potwierdź
$confirm = Read-Host "Czy chcesz ustawić te zmienne w Netlify? (tak/nie)"
if ($confirm -ne "tak") {
    Write-Host "Anulowano." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Logowanie do Netlify..." -ForegroundColor Cyan
netlify login

Write-Host ""
Write-Host "Linkowanie z projektem Netlify..." -ForegroundColor Cyan
netlify link

Write-Host ""
Write-Host "Ustawianie zmiennych środowiskowych..." -ForegroundColor Cyan

# Lista kluczowych zmiennych do ustawienia
$requiredVars = @(
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "S3_REGION",
    "JWT_SECRET",
    "NEXT_PUBLIC_BASE_URL",
    "DATABASE_URL"
)

foreach ($var in $requiredVars) {
    if ($envVars.ContainsKey($var)) {
        Write-Host "Ustawianie $var..." -ForegroundColor Yellow
        $value = $envVars[$var]
        netlify env:set $var "$value"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $var ustawione" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Błąd przy ustawianiu $var" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠ $var nie znalezione w .env" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Gotowe! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Następne kroki:" -ForegroundColor Cyan
Write-Host "1. Przejdź do panelu Netlify i zweryfikuj zmienne"
Write-Host "2. Trigger deploy: Deploys → Clear cache and deploy site"
Write-Host "3. Sprawdź funkcjonalność uploadu zdjęć"
Write-Host ""
