# 🚀 Instrukcja Wdrożenia (Deployment Guide)
**aktualizacja: 21.12.2025**

Strona `wlasniewski.pl` używa nowoczesnej architektury **Next.js 15 (App Router)** hostowanej na **Netlify** z bazą danych **Neon (PostgreSQL)**.

> ⚠️ Poprzednia instrukcja dotycząca PHP/Cyberfolks jest **nieaktualna**.

---

## 1. Architektura Wdrożenia

- **Frontend & API**: Netlify (Serverless Functions)
- **Baza Danych**: Neon.tech (PostgreSQL)
- **Repozytorium**: GitHub (branch `main`)

## 2. Jak Wdrożyć Zmianę (Standard Flow)

Wdrożenie dzieje się **automatycznie** po wypchnięciu kodu do brancha `main`.

### Krok 1: Weryfikacja Lokalna
Zanim zrobisz push, upewnij się, że projekt buduje się lokalnie:

```bash
# 1. Sprawdź poprawność kodu
npm run lint

# 2. Sprawdź czy projekt się buduje
npm run build
```

Jeśli `npm run build` zwróci **SUCCESS**, możesz przejść dalej. Jeśli błąd - napraw go!

### Krok 2: Wysłanie na Produkcję

```bash
# 1. Dodaj zmiany
git add .

# 2. Commit (zgodnie z konwencją)
git commit -m "feat: opis zmiany"

# 3. Push do main
git push origin main
```

### Krok 3: Monitoring

1. Wejdź na panel Netlify: https://app.netlify.com
2. Zobaczysz "Building" przy najnowszym commicie.
3. Proces trwa około 2-3 minuty.
4. Status zmieni się na **Published**.

---

## 3. Zarządzanie Bazą Danych (Migrations)

NIGDY nie używaj `prisma db push` na produkcji.

### Jak zaktualizować bazę produkcyjną:

Netlify automatycznie uruchamia migracje podczas builda (zdefiniowane w `package.json`).
Wystarczy, że dodasz plik migracji do repozytorium:

```bash
# Lokalnie:
npx prisma migrate dev --name nazwa_zmiany

# Git:
git add prisma/migrations
git commit -m "chore: database migration"
git push origin main
```

Netlify wykona `prisma migrate deploy` automatycznie.

---

## 4. Zmienne Środowiskowe (Environment Variables)

Jeśli dodajesz nowe klucze API (np. do marketingu), musisz je dodać w dwóch miejscach:

1. **Lokalnie**: plik `.env`
2. **Produkcja**: Netlify Dashboard -> Site Settings -> Environment variables

**Lista kluczowych zmiennych:**
- `DATABASE_URL` (Neon Connection String)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (Email)
- `STRIPE_SECRET_KEY` (Płatności)
- `JWT_SECRET` (Auth)

---

## 5. Troubleshooting (Gdy Deployment Padnie)

1. **Build Failed**: Sprawdź logi na Netlify ("Deploy Log"). Zazwyczaj to błąd TypeScript.
2. **Database Error**: Sprawdź czy Connection String w zmiennych środowiskowych jest poprawny.
3. **Strona nie działa**: Sprawdź `SystemLog` w bazie danych lub logi funkcji ("Functions" tab w Netlify).

👉 Więcej w pliku: `EMERGENCY_RECOVERY.md`
