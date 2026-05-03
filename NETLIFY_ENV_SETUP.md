# Konfiguracja zmiennych środowiskowych w Netlify

## Problem
Upload zdjęć przez uczestników warsztatów kończy się błędem 500 z komunikatem o brakujących AWS credentials.

## Rozwiązanie
Zmienne środowiskowe muszą być ustawione w panelu Netlify.

## Instrukcja krok po kroku

### 1. Zaloguj się do Netlify
- Przejdź na https://app.netlify.com/
- Znajdź swoją stronę (prawdopodobnie `wlasniewski.pl` lub podobna nazwa)

### 2. Przejdź do ustawień zmiennych środowiskowych
- Kliknij na swoją stronę
- Przejdź do **Site settings** → **Environment variables**
- Lub bezpośrednio: `https://app.netlify.com/sites/[TWOJA-STRONA]/settings/env`

### 3. Dodaj następujące zmienne

Kliknij **Add a variable** dla każdej z poniższych:

#### Wymagane zmienne AWS S3:
```
AWS_ACCESS_KEY_ID = [Skopiuj z .env]
AWS_SECRET_ACCESS_KEY = [Skopiuj z .env]
S3_BUCKET = wlasniewski-photo-storage
S3_REGION = eu-north-1
```

#### Wymagane zmienne aplikacji:
```
JWT_SECRET = [Skopiuj z .env - musi mieć min. 32 znaki]
NEXT_PUBLIC_BASE_URL = https://wlasniewski.pl
DATABASE_URL = [Skopiuj z .env lub .env.production]
```

**Uwaga**: Wartości wrażliwych zmiennych (AWS credentials, JWT_SECRET) znajdziesz w lokalnym pliku `.env` w katalogu głównym projektu.

### 4. Zapisz i zbuduj ponownie
Po dodaniu zmiennych:
- Kliknij **Save**
- Przejdź do **Deploys**
- Kliknij **Trigger deploy** → **Clear cache and deploy site**

### 5. Weryfikacja
Po zakończeniu budowania:
- Odśwież stronę warsztatu
- Spróbuj wgrać zdjęcie jako uczestnik
- Sprawdź logi funkcji w Netlify: **Functions** → kliknij na funkcję → **Function log**

## Alternatywna metoda (przez CLI)

Jeśli masz zainstalowane Netlify CLI:

```bash
netlify login
netlify link
netlify env:set AWS_ACCESS_KEY_ID "YOUR_KEY_FROM_ENV"
netlify env:set AWS_SECRET_ACCESS_KEY "YOUR_SECRET_FROM_ENV"
netlify env:set S3_BUCKET "wlasniewski-photo-storage"
netlify env:set S3_REGION "eu-north-1"
netlify env:set JWT_SECRET "YOUR_JWT_SECRET_FROM_ENV"
netlify env:set NEXT_PUBLIC_BASE_URL "https://wlasniewski.pl"
netlify env:set DATABASE_URL "YOUR_DATABASE_URL_FROM_ENV"
```

Zastąp wartości w cudzysłowach odpowiednimi wartościami z pliku `.env`.

## Jak sprawdzić czy zmienne są ustawione

W panelu Netlify przejdź do **Site settings** → **Environment variables** i sprawdź, czy wszystkie wymagane zmienne są na liście.

## Dalsze kroki

Po skonfigurowaniu zmiennych środowiskowych:
1. Zbuduj ponownie stronę w Netlify
2. Sprawdź funkcjonalność uploadu zdjęć
3. Sprawdź logi w panelu Netlify w przypadku dalszych problemów
