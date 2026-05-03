#!/bin/bash
# Skrypt do szybkiej konfiguracji zmiennych środowiskowych w Netlify
# Wymaga: Netlify CLI (npm install -g netlify-cli)
# Użycie: ./scripts/setup-netlify-env.sh

set -e

echo "=== Konfiguracja zmiennych środowiskowych Netlify ==="
echo ""

# Sprawdź czy Netlify CLI jest zainstalowane
if ! command -v netlify &> /dev/null; then
    echo "ERROR: Netlify CLI nie jest zainstalowane"
    echo "Zainstaluj: npm install -g netlify-cli"
    exit 1
fi

# Sprawdź czy plik .env istnieje
if [ ! -f ".env" ]; then
    echo "ERROR: Plik .env nie został znaleziony"
    exit 1
fi

echo "Wczytywanie zmiennych z .env..."

# Wczytaj zmienne z .env
export $(grep -v '^#' .env | xargs)

echo "Zmienne wczytane pomyślnie"
echo ""

# Potwierdź
read -p "Czy chcesz ustawić zmienne w Netlify? (tak/nie): " confirm
if [ "$confirm" != "tak" ]; then
    echo "Anulowano."
    exit 0
fi

echo ""
echo "Logowanie do Netlify..."
netlify login

echo ""
echo "Linkowanie z projektem Netlify..."
netlify link

echo ""
echo "Ustawianie zmiennych środowiskowych..."

# Lista kluczowych zmiennych do ustawienia
REQUIRED_VARS=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "S3_BUCKET"
    "S3_REGION"
    "JWT_SECRET"
    "NEXT_PUBLIC_BASE_URL"
    "DATABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    value=$(printenv "$var")
    if [ -n "$value" ]; then
        echo "Ustawianie $var..."
        netlify env:set "$var" "$value"
        echo "  ✓ $var ustawione"
    else
        echo "  ⚠ $var nie znalezione w .env"
    fi
done

echo ""
echo "=== Gotowe! ==="
echo ""
echo "Następne kroki:"
echo "1. Przejdź do panelu Netlify i zweryfikuj zmienne"
echo "2. Trigger deploy: Deploys → Clear cache and deploy site"
echo "3. Sprawdź funkcjonalność uploadu zdjęć"
echo ""
