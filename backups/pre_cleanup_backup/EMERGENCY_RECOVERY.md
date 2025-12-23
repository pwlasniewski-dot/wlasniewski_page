# 🚨 EMERGENCY RECOVERY PLAN - wlasniewski.pl
## Dokument Przywrócenia Po Katastrofie (21 grudnia 2025)

> **STATUS**: 🔴 CRITICAL  
> **PROBLEM**: Antygravity całkowicie wyczystił bazę danych  
> **ROZWIĄZANIE**: Step-by-step recovery procedure

---

## 📊 ANALIZA SZKÓD

### Co Zostało Usunięte (2025-12-21 Katastrofa)

```
❌ AdminUser (tabela)
   └─ Brak możliwości zalogowania do /admin
   └─ KRYTYCZNE - System niefunkcjonalny

❌ Package (tabela)
   └─ /rezerwacja pusty
   └─ KRYTYCZNE - Brak możliwości rezerwacji

❌ ServiceType (tabela)
   └─ Usługi do rezerwacji znikły
   └─ KRYTYCZNE - Cascade delete Package

❌ Setting (część tabeli)
   └─ Ustawienia globalne stracone
   └─ ŚREDNI - Można zresetować defaults

⚠️  Migracje Prismy
   └─ Nie wiadomo które były zastosowane
   └─ ŚREDNI - Możemy resync ze schematem
```

### Przyczyna

```
Agent "Antygravity" uruchomił:
  npx prisma db push

Na PRODUKCYJNEJ bazie (Neon.tech)
  
Zamiast:
  npx prisma migrate deploy

Wynik:
  - Schema reset do wersji z schema.prisma
  - Wszystkie rekordy usunięte
  - Migracje Prismy zsynchronizowane
```

---

## ✅ RECOVERY PLAN (Step-by-Step)

### STEP 1: Verify Current Database State

```bash
# 1. Connect to Prisma Studio
npx prisma studio

# 2. Check which tables exist
# ✅ Takie powinny być:
#   - admin_users (pusta)
#   - service_types (pusta)
#   - packages (pusta)
#   - pages (może mieć dane)
#   - settings (może mieć dane)

# 3. Check schema is correct
npx prisma validate
# → Powinno mówić: ✅ Schema validated

# 4. Sprawdź migrations folder
ls prisma/migrations/
# → Powinno być wiele folderów (każda migracja)
```

---

### STEP 2: Recreate AdminUser

**Goal**: Przywrócić możliwość zalogowania się do panelu admina

```bash
# Opcja A: Via Script (REKOMENDOWANY)
node scripts/create_admin.js
# → Wpisz email i hasło
# → Powinien zwrócić: ✅ Admin created

# Opcja B: Via Prisma Studio
npx prisma studio
# → Connect to DATABASE_URL
# → Go to "admin_users" table
# → Click "Add record"
# → Fill in:
#   - email: admin@wlasniewski.pl
#   - password_hash: (wygeneruj bcrypt hash)
#   - name: Administrator
#   - role: ADMIN

# Opcja C: SQL (Direct)
# Jeśli masz dostęp do Neon CLI:
psql $DATABASE_URL << 'EOF'
INSERT INTO admin_users (email, password_hash, name, role, created_at)
VALUES ('admin@wlasniewski.pl', '$2a$10$...', 'Administrator', 'ADMIN', NOW());
EOF
```

**Verification**:
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wlasniewski.pl","password":"yourpassword"}'

# Powinno zwrócić: { token: "jwt...", user: {...} }
```

---

### STEP 3: Recreate ServiceType & Package

**Goal**: Przywrócić możliwość rezerwacji

```bash
# Opcja A: Via Seed Script (REKOMENDOWANY)
npm run seed
# → Automatycznie wypełni testowe dane

# Opcja B: Via Script (Kontrolowany)
node scripts/seed-packages.js
# Lub jeśli istnieje:
node prisma/seed.ts

# Opcja C: Manual via Prisma Studio
npx prisma studio
# → Go to "service_types" table
# → Add records:
#   1. name: "Sesja Portretowa", icon: "camera", order: 1
#   2. name: "Sesja Ślubna", icon: "heart", order: 2
#   3. name: "Fotografia Produktowa", icon: "box", order: 3
#
# → Go to "packages" table
# → Add records for each service
```

**Seed Script Example** (jeśli potrzebujesz):

```typescript
// scripts/seed-packages.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  // Clear existing (optional)
  // await prisma.package.deleteMany({});
  // await prisma.serviceType.deleteMany({});

  // Create services
  const portraitService = await prisma.serviceType.create({
    data: {
      name: 'Sesja Portretowa',
      icon: 'camera',
      description: 'Profesjonalne portrety',
      order: 1,
      is_active: true
    }
  });

  // Create packages
  await prisma.package.create({
    data: {
      service_id: portraitService.id,
      name: 'Pakiet Podstawowy',
      price: 50000, // w groszach = 500 PLN
      hours: 1,
      description: 'Sesja 1 godzina, 10 zdjęć',
      order: 1,
      is_active: true
    }
  });

  console.log('✅ Seed completed');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
```

**Verification**:
```bash
# Check /rezerwacja page
curl http://localhost:3000/rezerwacja

# Powinno pokazać usługi i pakiety
```

---

### STEP 4: Restore Settings

**Goal**: Przywrócić konfigurację strony

```bash
# Opcja A: Reset do defaults (jeśli nic nie pamiętasz)
node scripts/reset-settings.js

# Opcja B: Restore z backupu (jeśli istnieje)
# Sprawdź czy masz backup:
ls backups/ | grep settings
# → Jeśli istnieje: restore

# Opcja C: Manual Setup
npx prisma studio
# → Go to "settings" table
# → Dodaj kluczowe wpisy:
#   - logo_url: "https://..."
#   - navbar_sticky: true
#   - email_notification: true
#   - booking_min_days_ahead: 7
```

---

### STEP 5: Verify All Critical Pages

**Goal**: Sprawdzić że strona działa

```bash
# 1. Homepage
curl -s http://localhost:3000 | grep "<title"
# → Powinno zawierać: "wlasniewski.pl"

# 2. Admin Login Page
curl -s http://localhost:3000/logowanie | grep "email"
# → Powinno zawierać formularz logowania

# 3. Rezerwacja
curl -s http://localhost:3000/rezerwacja | grep "package"
# → Powinno zawierać pakiety

# 4. API Endpoints
curl http://localhost:3000/api/packages
# → Powinno zwrócić JSON array

curl http://localhost:3000/api/settings
# → Powinno zwrócić ustawienia
```

---

### STEP 6: Run Full Test Suite

```bash
# Build production build
npm run build

# Powinno zakończyć się bez błędów
# If errors: fix them before deploying
```

---

### STEP 7: Deploy to Production

**⚠️ TYLKO JEŚLI kroki 1-6 są ✅**

```bash
# 1. Backup database (ostatnia chance)
# Via Neon CLI lub export

# 2. Push to main
git add -A
git commit -m "recovery: restore database after catastrophe (Dec 21)"
git push origin main

# 3. Monitor deployment
# https://app.netlify.com → Live Deploy Log

# 4. Test production
curl https://wlasniewski.pl/api/packages
# Powinno zawierać pakiety

# 5. Verify in browser
# - Otwórz https://wlasniewski.pl
# - Sprawdź admin login
# - Sprawdź rezerwacje
# - Sprawdź portfolio
```

---

## 🔍 DIAGNOSTIC COMMANDS

### Jeśli Coś Nie Działa

```bash
# 1. Check database connection
npm run migrate -- --verbose
# → Powinno pokazać migracje

# 2. Check Prisma schema
npx prisma validate
# → ✅ Schema validated (jeśli OK)

# 3. Check existing data
npx prisma studio
# → Visual inspection

# 4. Check logs
npm run dev 2>&1 | grep "ERROR"

# 5. Direct database query (Neon)
# Via Neon Console SQL Editor:
SELECT COUNT(*) FROM admin_users;
SELECT COUNT(*) FROM packages;
SELECT COUNT(*) FROM service_types;
```

---

## 🗺️ RESTORE PRIORITY ORDER

```
PRIORITY 1 (MUST DO):
├─ AdminUser              → /admin login
├─ ServiceType + Package  → /rezerwacja works
└─ HomePage              → Strona główna displays

PRIORITY 2 (SHOULD DO):
├─ Portfolio             → /portfolio displays
├─ Settings              → System configured
└─ Pages                 → Static pages work

PRIORITY 3 (NICE TO HAVE):
├─ Blog Posts            → /blog works
├─ Gift Cards            → Shop available
└─ Challenges            → Photo challenges work

PRIORITY 4 (EVENTUAL):
├─ Booking History       → Old bookings restored
├─ Customer Data         → Guest data
└─ Analytics             → Historical data
```

---

## 🚀 WHAT NOT TO DO

```
❌ NIGDY:
- Nie runuj `npm run prisma:push` znowu
- Nie usuwaj migrations folder
- Nie edytuj migration files ręcznie
- Nie resetuj bazy bez backupu
- Nie deployuj bez testu

✅ ZAWSZE:
- Test lokalnie (npm run dev)
- Build przed deploymentem
- Check migrations are applied
- Monitor po deploymencie
- Document w PROJECT_HISTORIA.md
```

---

## 📱 TESTING CHECKLIST

Po każdym kroku, sprawdź:

```
□ npm run dev starts without errors
□ http://localhost:3000 loads
□ http://localhost:3000/admin/login loads
□ /api/packages returns data
□ /api/settings returns data
□ /rezerwacja displays packages
□ npm run build completes
□ No TypeScript errors
□ No console errors in dev
```

---

## 🆘 IF RECOVERY FAILS

### Option A: Partial Restore (Recommended)

```bash
# Jeśli coś jest złamane, ale strona działa:

# 1. Zidentyfikuj co jest złamane
npm run migrate -- --verbose

# 2. Fix specific issue
# Np. brak AdminUser:
node scripts/create_admin.js

# 3. Redeploy
git push origin main
```

### Option B: Fresh Start (Nuclear Option)

```bash
# ⚠️ OSTATECZNOŚĆ - Usuń wszystko i zacznij od nowa

# 1. BACKUP EXISTING DATA (if any)
npx prisma studio → Export all

# 2. Full wipe (DEVELOPMENT ONLY)
npm run cleanup-db

# 3. Reapply schema
npm run migrate

# 4. Seed with test data
npm run seed

# 5. Rebuild
npm run build

# 6. Deploy
git push origin main
```

### Option C: Rollback Code (Last Resort)

```bash
# Jeśli nic nie działa, cofnij do ostatniej pracy wersji

git revert HEAD
git push origin main

# Netlify auto-deploys ostatni working commit
# Monitor: https://app.netlify.com
```

---

## 📞 SUPPORT MATRIX

| Problem | Solution | Time | Contact |
|---------|----------|------|---------|
| AdminUser missing | `node scripts/create_admin.js` | 2 min | Self-service |
| Packages empty | `npm run seed` | 5 min | Self-service |
| DB connection error | Check `DATABASE_URL` in .env | 5 min | Check Neon |
| Migration failed | `npm run migrate -- --verbose` | 10 min | See logs |
| Still broken | Rollback code | 5 min | `git revert HEAD` |
| Completely destroyed | Call in expert | Variable | Emergency escalation |

---

## 📝 RECOVERY LOG

Track your recovery progress here:

```
[2025-12-21 08:00] INCIDENT START: Database fully wiped by Antygravity
[2025-12-21 08:30] AdminUser recreated ✅
[2025-12-21 08:45] ServiceType + Package restored ✅
[2025-12-21 09:00] Settings restored ✅
[2025-12-21 09:15] All tests passing ✅
[2025-12-21 09:30] DEPLOYED TO PRODUCTION ✅

Status: RECOVERED
Next: Monitor for 24h, then continue with Faza 2
```

---

**Remember**: 
- Database is your most valuable asset
- Never experiment on production
- Always backup before changes
- Document everything

**You've got this! 💪**
