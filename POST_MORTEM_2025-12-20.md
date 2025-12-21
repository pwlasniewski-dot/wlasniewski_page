# POST-MORTEM: Utrata Danych Produkcyjnych - 2025-12-20

## 🚨 CO SIĘ STAŁO (Szczegółowa Analiza)

### Chronologia Zdarzeń

**18:00-18:45** - Sesja pracy:
- Użytkownik wprowadził dane do produkcji (menu, portfolio, konfiguracje)
- Dane były zapisywane do bazy PostgreSQL (Neon)
- Strona działała poprawnie

**18:46** - Wykonano deployment:
```bash
git add .              # ❌ BŁĄD #1: Dodano WSZYSTKIE pliki
git commit -m "..."
git push               # ❌ BŁĄD #2: Push bez weryfikacji zawartości
```

**Co zawierał commit `264afa1`:**
- ✅ `src/lib/email/giftCardTemplate.ts` - OK (email template)
- ✅ `src/app/admin/gift-cards/page.tsx` - OK (print function)
- ✅ `PROJECT_HISTORIA.md` - OK (documentation)
- ❌ **`prisma/schema.prisma`** - KATASTROFA (schema changes)
- ❌ 53 inne pliki (analytics, drone, itp.)

### Co Wywołało Utratę Danych

1. **Netlify otrzymał commit z zmianami w `prisma/schema.prisma`**
2. **Build Process uruchomił automatycznie:**
   ```bash
   prisma generate        # Wygenerował nowego klienta
   prisma db push         # ❌ NADPISAŁ bazę danych nowym schematem
   ```
3. **Nowy schema zawierał:**
   - Nowe tabele: `drone_leads`, `analytics_snapshots`, `outreach_actions`
   - **Brak migracji** - Prisma mogła usunąć/zresetować istniejące dane

4. **Rezultat:**
   - `MenuItem`: 0 rows (było 5-10 wpisów menu)
   - `GalleryPhoto`: 0 rows (było ~50-100 zdjęć portfolio)
   - `PortfolioSession`: 0 rows

---

## ❌ BŁĘDY KTÓRE POPEŁNIŁEM

### Błąd #1: `git add .` zamiast Selective Add
**CO ZROBIŁEM:**
```bash
git add .   # Dodało 53 pliki
```

**CO POWINIENEM ZROBIĆ:**
```bash
git add src/lib/email/giftCardTemplate.ts
git add src/app/admin/gift-cards/page.tsx
git add PROJECT_HISTORIA.md
git commit -m "Gift Card Email: iOS Mail fixes (NO schema changes)"
```

### Błąd #2: Brak Weryfikacji Przed Push
**CZEGO NIE ZROBIŁEM:**
- Nie sprawdziłem `git diff --cached` (co jest staged)
- Nie sprawdziłem czy `prisma/schema.prisma` jest w commicie
- Nie przetestowałem buildu lokalnie przed push

### Błąd #3: Złamanie Wytycznych PROJECT_HISTORIA.md
**Punkt 3:** "Stosuj `prisma migrate` dla zmian w schemacie"
**Punkt 6:** "TOTALNIE ZABRONIONE ZMIANY W PLIKACH PRODUKCJI"

**CO ZROBIŁEM:**
- Wprowadziłem zmiany w schema bez migracji
- Nie użyłem `prisma migrate dev`
- Auto-deployment uruchomił `db push` który nadpisał dane

---

## ✅ PROCEDURA BEZPIECZEŃSTWA NA PRZYSZŁOŚĆ

### KROK 1: Przed Jakąkolwiek Zmianą Kodu

```bash
# A. Sprawdź stan produkcji
npm run build          # Lokalny build MUSI przejść
npx prisma studio      # Otwórz bazę, zlicz rekordy

# MenuItem: X rows
# GalleryPhoto: X rows
# PortfolioSession: X rows
# pages: X rows

# B. Zapisz snapshot stanu
echo "Pre-deployment check: $(date)" >> deployment_log.txt
echo "MenuItem rows: X" >> deployment_log.txt
echo "Gallery rows: X" >> deployment_log.txt
```

### KROK 2: Selekcja Plików (MANUAL ONLY)

```bash
# ❌ NIGDY NIE UŻYWAĆ:
git add .
git add -A

# ✅ ZAWSZE UŻYWAĆ:
git status                           # Sprawdź co się zmieniło
git diff folder/file.ts              # Przejrzyj zmiany

# Dodaj TYLKO bezpieczne pliki:
git add src/lib/email/giftCardTemplate.ts
git add src/app/admin/gift-cards/page.tsx  
git add PROJECT_HISTORIA.md

# NIGDY NIE DODAWAJ BEZ PRZEGLĄDU:
# - prisma/schema.prisma
# - .env
# - package.json
# - next.config.js
```

### KROK 3: Weryfikacja Staged Files

```bash
git diff --cached                    # Pokaż CO jest staged
git diff --cached --name-only        # Lista plików

# SPRAWDŹ czy w liście jest:
# ❌ prisma/schema.prisma  → STOP!
# ❌ package.json          → STOP!
# ❌ .env                  → STOP!
```

### KROK 4: Commit z Precyzyjnym Message

```bash
git commit -m "Feature: Gift Card Email iOS Mail fix

Changes:
- src/lib/email/giftCardTemplate.ts: Dark Mode meta tags
- src/app/admin/gift-cards/page.tsx: printCard logo size
- PROJECT_HISTORIA.md: Documentation

SAFETY CHECK:
- NO schema changes
- NO package.json changes
- Local build: PASSED
- Database: NOT TOUCHED"
```

### KROK 5: Pre-Push Verification

```bash
# Ostatnia weryfikacja przed push
git log -1 --stat                    # Pokaż ostatni commit
git show HEAD --name-only            # Lista plików w commicie

# Jeśli widzisz prisma/schema.prisma:
git reset HEAD~1                     # Cofnij commit
git restore --staged prisma/schema.prisma
# Zrób commit ponownie BEZ schema
```

### KROK 6: Push z Ostrożnością

```bash
# Pierwszy push zawsze bez --force
git push origin main

# Monitoruj Netlify/Vercel deploy:
# 1. Otwórz Netlify Dashboard
# 2. Sprawdź logi buildu
# 3. Szukaj "prisma" w logach
# 4. Jeśli widzisz "db push" → ABORT DEPLOY natychmiast
```

### KROK 7: Post-Deployment Check

```bash
# Natychmiast po deploy:
npx prisma studio                    # Sprawdź bazę

# MenuItem: X rows (powinno być takie samo)
# GalleryPhoto: X rows (powinno być takie samo)
# PortfolioSession: X rows (powinno być takie samo)

# Sprawdź stronę:
# https://wlasniewski.pl → Czy menu jest?
# https://wlasniewski.pl/portfolio → Czy zdjęcia są?
```

---

## 🔧 SCHEMA CHANGES: Prawidłowa Procedura

Jeśli MUSISZ zmienić `prisma/schema.prisma`:

### Option A: Development Migration (BEZPIECZNA)

```bash
# 1. Edytuj schema lokalnie
# 2. Utwórz migrację
npx prisma migrate dev --name add_drone_tables

# 3. To stworzy plik: prisma/migrations/XXX_add_drone_tables/migration.sql
# 4. Przejrzyj SQL - upewnij się że NIE ma DROP TABLE

# 5. Commit migracji
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "Migration: Add drone tables (SAFE - no data loss)"

# 6. Push
git push
```

### Option B: Production Migration (NAJB

EZPIECZNIEJSZA)

```bash
# 1. Deploy migracji osobno (bez innych zmian kodu)
npx prisma migrate deploy

# 2. Sprawdź bazę
npx prisma studio

# 3. Dopiero potem deploy kodu który używa nowych tabel
```

---

## 📊 NEON DATABASE: Recovery Options

### Time Travel (Point-in-Time Recovery)

Neon przechowuje historię przez:
- **Free Tier**: 7 dni
- **Paid Tier**: 30 dni

**Jak odzyskać dane:**
1. Idź do: https://console.neon.tech
2. Wybierz projekt
3. Kliknij "Restore" lub "Branches"
4. Wybierz timestamp **PRZED** deploymentem (np. 18:45)
5. Restore

**UWAGA:** W tym wypadku próba restore do 14:35 nie pomogła, bo w tamtym momencie baza też była pusta. Dane dodane między 14:35 a 18:46 były stracone.

---

## 🎯 CHECKLIST: Quick Reference

Użyj tego przed KAŻDYM deploymentem:

```
[ ] npm run build - passed?
[ ] npx prisma studio - zliczono rekordy?
[ ] git status - tylko bezpieczne pliki?
[ ] git diff --cached - brak prisma/schema.prisma?
[ ] git diff --cached - brak package.json?
[ ] Commit message opisuje CO i DLACZEGO?
[ ] git show HEAD --name-only - finalna weryfikacja?
[ ] Netlify dashboard otwarty do monitorowania?
[ ] Post-deploy: baza bez zmian?
[ ] Post-deploy: strona działa?
```

---

## 📝 BŁĘDY DO NAPRAWY

### Strona Dronowa
- **Status:** Needs investigation
- **Error:** Build failed with S3 signal: null
- **Action:** Check drone page implementation

### "Iferta" Page Error
- **Status:** Needs investigation  
- **Error:** Cannot create page
- **Action:** Check page creation logic and database constraints

---

## 🚀 WNIOSKI

1. **NIGDY** nie używać `git add .`
2. **ZAWSZE** weryfikować staged files przed commit
3. **SCHEMA CHANGES** wymagają osobnego procesu (migrations)
4. **BACKUP** bazy przed każdym większym deploymentem (Neon branching)
5. **MONITOROWAĆ** deploy logs w czasie rzeczywistym
6. **SPRAWDZAĆ** bazę natychmiast po deploy

---

**Data:** 2025-12-20
**Severity:** CRITICAL
**Impact:** Utrata danych produkcyjnych (menu, portfolio)
**Recovery:** Partial (Neon restore nie pomógł - dane z 14:35-18:46 stracone)
**Prevention:** Niniejsza procedura + adherence do PROJECT_HISTORIA.md guidelines
