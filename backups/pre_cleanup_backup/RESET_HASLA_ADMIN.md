# 🔐 Reset Hasła Admina - Instrukcja

## 📋 Spis Treści
- [Metoda 1: Skrypt Node.js (POLECANE)](#metoda-1-skrypt-nodejs)
- [Metoda 2: API Emergency Reset](#metoda-2-api-emergency-reset)
- [Metoda 3: Bezpośrednio w Bazie](#metoda-3-bezpośrednio-w-bazie)
- [Troubleshooting](#troubleshooting)

---

## Metoda 1: Skrypt Node.js ⭐ (POLECANE)

### Użycie

```bash
node scripts/reset-admin-password.js
```

Ten skrypt:
1. 📋 Wyświetli listę wszystkich adminów w bazie
2. ✏️ Pozwoli wybrać admina
3. 🔑 Wpisać nowe hasło
4. ✅ Automatycznie zahashuje i zapisze w bazie

### Przykład

```
🔐 Reset Hasła Admina

Dostępni administratorzy:
1. przemyslaw@wlasniewski.pl (Przemysław)

Wybierz numer admina (1-1): 1

Wybrany admin: przemyslaw@wlasniewski.pl
Wpisz nowe hasło (min 8 znaków): NoweHaslo123!

⚠️  Czy na pewno chcesz zmienić hasło dla przemyslaw@wlasniewski.pl? (tak/nie): tak

🔄 Hashowanie hasła...
💾 Zapisywanie w bazie...

✅ Hasło zostało zmienione!
📧 Email: przemyslaw@wlasniewski.pl
🔑 Nowe hasło: NoweHaslo123!

Możesz się teraz zalogować na /admin/login
```

---

## Metoda 2: API Emergency Reset

### Endpoint

```
POST /api/admin/emergency-reset
```

### Wymagane dane

```json
{
  "email": "przemyslaw@wlasniewski.pl",
  "newPassword": "NoweHaslo123!",
  "masterKey": "WLASNIEWSKI2024RESET"
}
```

### Użycie przez cURL

```bash
curl -X POST http://localhost:3000/api/admin/emergency-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "przemyslaw@wlasniewski.pl",
    "newPassword": "NoweHaslo123!",
    "masterKey": "WLASNIEWSKI2024RESET"
  }'
```

### Użycie przez przeglądarkę (F12 Console)

```javascript
fetch('/api/admin/emergency-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'przemyslaw@wlasniewski.pl',
    newPassword: 'NoweHaslo123!',
    masterKey: 'WLASNIEWSKI2024RESET'
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

### Użycie przez Postman

1. Otwórz Postman
2. Utwórz nowy request `POST`
3. URL: `http://localhost:3000/api/admin/emergency-reset`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "email": "przemyslaw@wlasniewski.pl",
  "newPassword": "NoweHaslo123!",
  "masterKey": "WLASNIEWSKI2024RESET"
}
```
6. Kliknij **Send**

---

## Metoda 3: Bezpośrednio w Bazie

### Krok 1: Zahashuj hasło

Użyj generatora online: https://bcrypt-generator.com/

- **Hasło:** `NoweHaslo123!`
- **Rounds:** `10`
- **Hash:** `$2a$10$...` (skopiuj wynik)

### Krok 2: Update w PostgreSQL

Połącz się z bazą i wykonaj:

```sql
UPDATE admin_users 
SET password_hash = '$2a$10$twój_zahashowany_hash_tutaj'
WHERE email = 'przemyslaw@wlasniewski.pl';
```

### Przykład z konkretnym hashem

Jeśli chcesz ustawić hasło `Admin12345!`:

```sql
UPDATE admin_users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'przemyslaw@wlasniewski.pl';
```

---

## 🔧 Troubleshooting

### Problem: "Brak adminów w bazie danych"

**Rozwiązanie:** Utwórz admina ręcznie:

```sql
INSERT INTO admin_users (email, password_hash, name, role, created_at)
VALUES (
  'przemyslaw@wlasniewski.pl',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- hasło: Admin12345!
  'Przemysław Właśniewski',
  'ADMIN',
  NOW()
);
```

### Problem: "Nieprawidłowy klucz" (emergency reset)

**Rozwiązanie:** Sprawdź `ADMIN_MASTER_KEY` w `.env`:

```bash
ADMIN_MASTER_KEY=WLASNIEWSKI2024RESET
```

Lub zmień klucz bezpośrednio w `src/app/api/admin/emergency-reset/route.ts` (linia 13).

### Problem: Nie można połączyć z bazą

**Rozwiązanie:** Sprawdź `DATABASE_URL` w `.env`:

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

Upewnij się że:
1. Baza danych działa
2. Credentials są poprawne
3. Prisma client jest wygenerowany: `npx prisma generate`

### Problem: "bcryptjs not found"

**Rozwiązanie:**

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## 🔒 Bezpieczeństwo

### Zmiana Master Key

Aby zmienić klucz awaryjnego resetu, ustaw w `.env`:

```bash
ADMIN_MASTER_KEY=twoj_super_tajny_klucz_tutaj
```

Lub edytuj plik `src/app/api/admin/emergency-reset/route.ts`:

```typescript
const expectedKey = process.env.ADMIN_MASTER_KEY || 'TWOJ_NOWY_KLUCZ';
```

### Wyłączenie Emergency Reset (produkcja)

Na produkcji zaleca się **wyłączyć** endpoint `/api/admin/emergency-reset`:

**Opcja 1:** Usuń plik `src/app/api/admin/emergency-reset/route.ts`

**Opcja 2:** Dodaj warunek środowiskowy:

```typescript
export async function POST(request: NextRequest) {
    // Tylko dla developmentu
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
    }
    // ... reszta kodu
}
```

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź logi: `npm run dev` i szukaj błędów
2. Zrestartuj serwer dev
3. Sprawdź połączenie z bazą: `npx prisma studio`
4. Jeśli nic nie działa, stwórz nowego admina przez SQL (patrz wyżej)

---

**Ostatnia aktualizacja:** 10 grudnia 2024
