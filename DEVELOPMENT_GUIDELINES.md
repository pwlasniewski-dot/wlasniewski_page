# 🛡️ DEVELOPMENT GUIDELINES - wlasniewski.pl
## Jasne Zasady Rozwoju Strony (Anti-Antygravity Protocol)

> **Data**: 21 grudnia 2025  
> **Status**: 🔴 CRITICAL - Po katastrofalnym wyczyszczeniu bazy (2025-12-21)  
> **Autoryzacja**: Tylko utwierdzone zmiany na produkcji

---

## 📋 SPIS TREŚCI

1. [Fazy Operacyjne](#fazy-operacyjne)
2. [Hierarchia Priorytetów](#hierarchia-priorytetów)
3. [BEZWZGLĘDNE ZAKAZY](#bezwzględne-zakazy)
4. [Procedury Bezpieczeństwa](#procedury-bezpieczeństwa)
5. [Git Workflow](#git-workflow)
6. [Prawidłowa Migracja](#prawidłowa-migracja-danych)
7. [Checklist Deployment](#checklist-deployment)

---

## 🎯 FAZY OPERACYJNE

### FAZA 1: STABILIZACJA (21 grudnia 2025 - TBD)

**CEL**: Przywrócić funkcjonalność systemu do stanu sprzed katastrofy

**KRYTYCZNE ZADANIA**:
- [ ] ✅ Przywrócić `AdminUser` (możliwość zalogowania się do `/admin`)
- [ ] ✅ Przywrócić `Package` i `ServiceType` (działające `/rezerwacja`)
- [ ] ✅ Przywrócić `Setting` (konfiguracja systemowa)
- [ ] Zweryfikować integrość bazy danych
- [ ] Wykonać pełny test wszystkich endpointów API

**ZAKAZANE OPERACJE**:
- ❌ `npm run prisma:push` (NIGDY bez konsultacji)
- ❌ `prisma db push --force-reset`
- ❌ Edycja `schema.prisma` bez migracji
- ❌ Usuwanie tabel z bazy

**METRYKI SUKCESU**:
```
- [ ] Login admin: ✅ działa
- [ ] Rezerwacje: ✅ wyświetlają się pakiety
- [ ] Ustawienia: ✅ zapisują się correctnie
- [ ] Portfolio: ✅ wyświetla się bez błędów
- [ ] API: ✅ wszystkie endpointy zwracają dane
```

---

### FAZA 2: MODERNIZACJA (Po Fazie 1)

**CEL**: Dodawać nowe funkcjonalności bez ryzyka utraty danych

**DOZWOLONE**:
- ✅ Dodawanie nowych kolumn (tylko append, nigdy nie usuwanie)
- ✅ Tworzenie nowych tabel
- ✅ Refaktoryzacja kodu (bez zmian w schemacie DB)
- ✅ Optymalizacja wydajności

**ZAKAZANE**:
- ❌ Usuwanie kolumn
- ❌ Zmiana typu danych istniejącej kolumny
- ❌ Usuwanie relacji

---

### FAZA 3: EKSPANSJA (Długoterminowo)

**CEL**: Wprowadzać zaawansowane cechy (Analytics, AI, DashBoard)

**WYMAGANIA**:
- Każda zmiana w `schema.prisma` wymaga `prisma migrate`
- Każda migracja musi być zapisana w `PROJECT_HISTORIA.md`
- Code review przed merżem do `main`
- Testy na staging przed wdrożeniem na produkcję

---

## 🏆 HIERARCHIA PRIORYTETÓW

```
1. 🔴 BEZPIECZEŃSTWO DANYCH (Safety First)
   └─ Nigdy nie usuwać danych bez backupu
   └─ Nigdy nie resetować bazy na produkcji
   └─ Zawsze migrować zamiast push

2. 🟡 STABILNOŚĆ SYSTEMU (Zero Downtime)
   └─ Testy przed deploymentem
   └─ Rollback plan dla każdej zmian
   └─ Monitoring po deploymencie

3. 🟢 ROZWÓJ FUNKCJONALNOŚCI (Growth)
   └─ Nowe cechy
   └─ Optymalizacja
   └─ Refaktoryzacja

4. 🔵 DOŚWIADCZENIE UŻYTKOWNIKA (DX)
   └─ UI/UX improvements
   └─ Performance tuning
   └─ Dokumentacja
```

---

## 🚫 BEZWZGLĘDNE ZAKAZY

### 1️⃣ BAZA DANYCH - TIER 1 (Śmierć na Ekranie)

```
❌ NIGDY nie używaj:
- prisma db push
- prisma db reset
- DELETE * FROM (bez WHERE)
- DROP TABLE (bez backupu)

✅ ZAWSZE używaj:
- prisma migrate create --name "descriptive_name"
- prisma migrate deploy
- SELECT COUNT(*) FROM (weryfikacja)
```

**KONSEKWENCJA**: Natychmiastowy lock dostępu do bazy

---

### 2️⃣ CODE CHANGES - TIER 2 (Bez Code Review)

```
❌ Zmiana bez Code Review:
- Modyfikacja schema.prisma
- Edycja /api (ściażki endpointów)
- Zmiana authentication logic
- Modyfikacja Payment API

✅ Zawsze zatwierdź z kolegą:
- Pokaż PR na GitHubie
- Opisz zmianę w PROJECT_HISTORIA.md
- Czekaj na ✅ approval
```

**KONSEKWENCJA**: Revert commit + karny meeting

---

### 3️⃣ DEPLOYMENT - TIER 3 (Bez Testów)

```
❌ Deploy bez:
- npm run build (lokalnie)
- Manual test na staging
- Backup bazy danych
- Sprawdzenie logów

✅ Deployment checklist (patrz poniżej)
```

**KONSEKWENCJA**: Rollback + karny meeting

---

## 🔐 PROCEDURY BEZPIECZEŃSTWA

### Procedura 1: Edycja Schema.prisma

```bash
# KROK 1: Utwórz branch
git checkout -b feat/nazwa-zmiany

# KROK 2: Edytuj schema.prisma
nano prisma/schema.prisma

# KROK 3: Utwórz migrację (NIE PUSH!)
npx prisma migrate dev --name "descriptive_name"
# Wpisz: "YES" aby zastosować do dev db

# KROK 4: Lokalne testy
npm run dev
# Sprawdź czy strona działa

# KROK 5: Wyślij PR
git add prisma/
git commit -m "chore: add migration for xyz"
git push origin feat/nazwa-zmiany

# KROK 6: Code Review
# → Poczekaj na ✅ approval

# KROK 7: Merge do main
git checkout main
git pull origin main
git merge feat/nazwa-zmiany
git push origin main

# KROK 8: Netlify auto-deploy
# Monitoruj: https://app.netlify.com
```

**⚠️ NIGDY NIE RÓB**:
- `git push --force`
- `prisma db push` na produkcji
- Merge bez testu na dev

---

### Procedura 2: Backup Przed Zmianą

```bash
# KROK 1: Eksportuj dane z Neon
# (jeśli masz dostęp do CLI)

# KROK 2: Backup w Prisma Studio
npx prisma studio
# → Export tabeli do JSON

# KROK 3: Archiwizuj w Git
git add backups/
git commit -m "backup: before xyz migration"
git push

# KROK 4: Dopiero teraz migruj
npx prisma migrate deploy
```

---

### Procedura 3: Jeśli Coś Pójdzie Nie Tak

```bash
# KROK 1: STOP - nie rób więcej zmian!
echo "HALT - Database may be corrupted"

# KROK 2: Sprawdź co się stało
npm run migrate -- --verbose

# KROK 3: Ostateczna decyzja:
# Opcja A: Rollback kodu
git revert <commit-hash>
git push

# Opcja B: Rollback migracji
npx prisma migrate resolve --rolled-back migration_name

# KROK 4: Powiadom zespół
# Wyślij wiadomość z opisem problemu
```

---

## 📚 GIT WORKFLOW

### Branches:

```
main
  ↑
  └─ staging (optional)
       ↑
       └─ feat/nazwa-feature (twój branch)
       └─ fix/nazwa-bugu
       └─ chore/maintenance
```

### Commit Messages:

```
feat:    Nowa funkcjonalność
fix:     Napraw bugu
chore:   Migracje, dependenciesie
refactor: Przepisanie kodu (bez zmian funkcji)
docs:    Dokumentacja
test:    Testy

Przykład:
feat: add user authentication to admin panel
chore: add prisma migration for gift_cards table
fix: resolve missing logo on homepage
```

### Merge Strategy:

```
PULL REQUEST
    ↓
Code Review (1 osoba minimum)
    ↓
Squash Merge (1 commit = 1 feature)
    ↓
Auto-deploy na staging (jeśli Netlify skonfigurowany)
    ↓
Manual approval → production
```

---

## 🗄️ PRAWIDŁOWA MIGRACJA DANYCH

### Scenariusz: Dodanie Nowej Kolumny

```bash
# ❌ ŹRÓDŁO BÓLU - Antygravity robił:
npx prisma db push

# ✅ PRAWIDŁOWO - Robi się tak:

# 1. Edytuj schema.prisma
# Model Package {
#   ...
#   new_field String? @default("") ← dodaj nową kolumnę
# }

# 2. Utwórz migrację
npx prisma migrate dev --name "add_new_field_to_package"

# 3. Sprawdź migration file
ls prisma/migrations/
# → Zweryfikuj że file zawiera ALTER TABLE

# 4. Lokalne testy
npm run dev

# 5. Wyślij PR, czekaj na review
git push origin feat/add-new-field

# 6. Po approval: merge i deploy
git merge feat/add-new-field
git push origin main

# 7. Netlify automatycznie:
# - Downloaduje kod
# - Runuje `npm run migrate` (z build script)
# - Aplikuje migrację do Neon
# - Restartuje serwer
```

### Scenariusz: Usunięcie Kolumny (RZADKO!)

```bash
# ⚠️ NIEBEZPIECZNE - Wykonaj TYLKO jeśli jesteś pewny

# 1. BACKUP (OBOWIĄZKOWY!)
npx prisma studio
# → Export package table

# 2. Edytuj schema.prisma
# Usunięty field

# 3. Migracja
npx prisma migrate dev --name "remove_unused_field"

# 4. Zweryfikuj backup jest bezpieczny
ls backups/ | grep package

# 5. DOPIERO po weryfikacji backup'u - deployuj
```

---

## ✅ CHECKLIST DEPLOYMENT

### Przed Deploy na Production

```
┌─────────────────────────────────────┐
│ 24 GODZINY PRZED DEPLOYMENTEM       │
└─────────────────────────────────────┘

□ Code Review: ✅ Aproved
□ Tests: ✅ Passing
□ Lint: ✅ No errors
  npm run lint

□ Build: ✅ Success
  npm run build

□ Schema Check: ✅ Valid
  npx prisma validate

□ Backup Plan: ✅ Documented
  - Rollback commit zaznaczony
  - Database backup gotowy

┌─────────────────────────────────────┐
│ W TRAKCIE DEPLOYMENTU               │
└─────────────────────────────────────┘

□ Notify Team:
  "Deploying: feat/xyz at 14:30 CET"

□ Monitor:
  - https://app.netlify.com (live logs)
  - https://console.neon.tech (DB health)
  - https://wlasniewski.pl (test page)

□ Test Key Features:
  - [ ] Homepage loads
  - [ ] Admin login works
  - [ ] Rezerwacje wyświetlają pakiety
  - [ ] Portfolio works
  - [ ] Kontakt wysyła email

┌─────────────────────────────────────┐
│ PO DEPLOYMENCIE (1h)                │
└─────────────────────────────────────┘

□ Production Smoke Test:
  - Check homepage
  - Try admin login
  - Make test booking

□ Monitor Logs:
  - No 500 errors
  - No database warnings
  - API responses normal

□ Verify Database:
  npx prisma studio
  - Connect to production DB
  - Check recent records

□ Document:
  - Add entry to PROJECT_HISTORIA.md
  - Mark task as DONE

```

---

## 🎓 PRZYPADKI UŻYTKU

### Use Case 1: Dodam Nową Usługę do Rezerwacji

```
1. Edytuj schema.prisma (jeśli potrzeba nowych pól)
2. npm prisma migrate dev --name "add_new_service"
3. Edytuj /api/packages/ endpoint
4. Test lokalnie
5. Create PR
6. Poczekaj na review
7. Merge do main
8. Auto-deploy na Netlify
```

### Use Case 2: Naprawić Bug w Adminzie

```
1. git checkout -b fix/admin-bug
2. Edytuj kod
3. npm run dev (test lokalnie)
4. git push
5. Create PR
6. Review (może być auto-merged jeśli nie jest DB change)
7. Merge
8. Deploy
```

### Use Case 3: Zmigrowac Stare Dane

```
1. ⚠️ BACKUP FIRST!
2. npx prisma studio (export dane)
3. Napisz migration script
4. Test na dev db
5. Zatwierdź z kolegą
6. Run script
7. Verify data integrity
8. Dokumentuj w PROJECT_HISTORIA.md
```

---

## 🚨 EMERGENCY PROCEDURES

### 🔴 ALARM: Baza Danych Się Zawiesiła

```bash
# STAGE 1: Diagnostic
npm run migrate -- --verbose
# → Sprawdź co się zawaliło

# STAGE 2: Check DB Connection
curl https://console.neon.tech
# → czy Neon jest online?

# STAGE 3: Rollback
git revert HEAD
git push
# → Netlify auto-deploys ostatniej pracy wersji

# STAGE 4: Manual Restore
# Jeśli rollback nie działa:
# - Contact Neon support
# - Restore from backup (jeśli dostępne)
```

### 🔴 ALARM: Admin Nie Może Się Zalogować

```bash
# DEFAULT ADMIN CREDENTIALS:
# Email:    pwlasniewski@gmail.com
# Password: Fotograf2025!
#
# (Change in /admin/settings after first login!)

# If login still fails:

# 1. Sprawdź czy AdminUser istnieje
npx prisma studio
# → Connect to production
# → Check admin_users table

# 2. Jeśli brakuje AdminUser:
node create_admin.js
# → Utwórz nowego admina z domyślnym hasłem

# 3. Jeśli tabela nie istnieje:
npm run migrate
# → Zastosuj migracje
```

### 🔴 ALARM: Rezerwacje Nie Działają

```bash
# 1. Check Package table
npx prisma studio → packages

# 2. Check ServiceType table
npx prisma studio → service_types

# 3. If empty:
npm run seed
# → Wypełnij dane testowe

# 4. If still broken:
# Sprawdź /api/packages endpoint logs
```

---

## 📖 REFERENCES

### Dokumenty Wymagające Przeczytania

- [ARCHITECTURE.md](ARCHITECTURE.md) - Jak działa cała strona
- [PROJECT_HISTORIA.md](PROJECT_HISTORIA.md) - Historia zmian (dodawaj tam wszystko)
- [DEVELOPER_CHANGES_CHANGELOG.md](DEVELOPER_CHANGES_CHANGELOG.md) - Szczegółowe logi

### Linki Narzędziowe

- **Neon Dashboard**: https://console.neon.tech
- **Netlify Dashboard**: https://app.netlify.com
- **Prisma Studio**: `npx prisma studio` (lokalnie)

### Skrypty Utility

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build production
npm run migrate          # Apply migrations
npm run seed             # Fill test data

# Diagnostics
npx prisma studio       # GUI Database Browser
npx prisma validate     # Check schema
npm run lint             # Check code quality

# Dangerous (Use Carefully)
npm run cleanup-db       # Wipe all data (DEVELOPMENT ONLY)
npm run seed             # Repopulate test data
```

---

## 👥 TEAM ROLES & RESPONSIBILITIES

```
ADMIN (Super User)
├─ Może pushować do main
├─ Aprwuje deployments
└─ Zarządza dostępem

DEVELOPER (Senior)
├─ Code reviews
├─ Schema.prisma edycja
└─ Migracje danych

DEVELOPER (Junior)
├─ Feature branches
├─ Bug fixes
└─ Czeka na review

BOT (CI/CD)
├─ Auto-test
├─ Lint check
└─ Auto-deploy (po approval)
```

---

## 📞 SUPPORT & ESCALATION

```
Problem                  | First Contact        | Escalation
─────────────────────────────────────────────────────────────
Baza Danych Down         | Neon Support         | AWS Support
API 500 Error            | Check Logs           | Rollback Deploy
Admin Login Fails         | Check AdminUser      | Seed DB
Rezerwacje Puste          | Check Package        | Restore Backup
Migration Failed          | Revert Commit        | Manual Fix
Performance Issue         | Check CDN            | Optimize Queries
```

---

## ✨ FINAL RULES (Golden Rules)

> 📌 Przywieś do KAŻDEJ implementacji

1. **BACKUP FIRST** - Zawsze rób backup przed zmianami
2. **TEST LOCALLY** - Sprawdź na dev przed deploymentem
3. **ONE CHANGE AT A TIME** - Nie rób 10 zmian naraz
4. **DOCUMENT EVERYTHING** - Dodaj wpis do PROJECT_HISTORIA.md
5. **CODE REVIEW** - Zawsze czekaj na approval
6. **MONITOR AFTER** - Czekaj 1h po deploymencie
7. **NEVER FORCE PUSH** - git push --force = permanent ban
8. **RESPECT THE DATABASE** - To jest twoja najcenniejsza rzecz

---

**Data ostatniej aktualizacji**: 21 grudnia 2025  
**Status**: 🔴 CRITICAL - Recovery Mode  
**Next Review**: Po przywróceniu systemu do Fazy 2

---

> **"A single mistake in database management can destroy months of work."**  
> — Every developer who learned the hard way

**Stay safe. Code responsibly. 🛡️**
