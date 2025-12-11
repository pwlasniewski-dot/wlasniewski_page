# 🗑️ Czyszczenie Bazy Danych - Instrukcje

## Scenariusz 1: Czyszczenie Wszystkiego (Fresh Start)

Jeśli chcesz wyczyścić **całą bazę** i zacząć od nowa:

### Krok 1: Uruchom script czyszczenia

```bash
node cleanup-database-full.js
```

**Wpisz `CZYSZCZĘ` aby potwierdzić** (bez cudzysłowów)

Operacja usunie **wszystkie** rekordy ze wszystkich tabel.

### Krok 2: Zastosuj migracje Prismy

```bash
npm run migrate
```

To odbuduje strukturę bazy (tabelę, kolumny) na podstawie `schema.prisma`

### Krok 3: (Opcjonalne) Wypełnij dane testowe

```bash
npm run seed
```

To doda domyślne dane testowe (strona główna, usługi, itp.)

### Krok 4: Uruchom dev server

```bash
npm run dev
```

Baza jest gotowa! 🎉

---

## Scenariusz 2: Czyszczenie Tylko Duplicatów

Jeśli chcesz **nie usuwać wszystkiego**, tylko naprawić duplikaty:

```bash
node cleanup-database.js
```

Ten script:
- ✅ Usuwa duplikaty strony głównej
- ✅ Czyści tabelę `menu_items`
- ✅ Naprawia konflikty `menu_order`
- ❌ Nie usuwa pozostałych danych

---

## Scenariusz 3: Manualne czyszczenie na Neon/Netlify

Jeśli scripts nie działają, możesz czyścić ręcznie:

### Opcja A: Via Neon Dashboard

1. Wejdź na https://console.neon.tech
2. Przejdź do swojej bazy danych
3. Otwórz SQL Editor
4. Skopiuj i uruchom poniższe komendy:

```sql
-- Usuń wszystkie tabele (w odpowiedniej kolejności)
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Reservation" CASCADE;
DROP TABLE IF EXISTS "Inquiry" CASCADE;
DROP TABLE IF EXISTS "Package" CASCADE;
DROP TABLE IF EXISTS "ServiceType" CASCADE;
DROP TABLE IF EXISTS "PhotoChallengePicture" CASCADE;
DROP TABLE IF EXISTS "PhotoChallenge" CASCADE;
DROP TABLE IF EXISTS "GalleryImage" CASCADE;
DROP TABLE IF EXISTS "GalleryFolder" CASCADE;
DROP TABLE IF EXISTS "Hero" CASCADE;
DROP TABLE IF EXISTS "About" CASCADE;
DROP TABLE IF EXISTS "InfoBand" CASCADE;
DROP TABLE IF EXISTS "Testimonial" CASCADE;
DROP TABLE IF EXISTS "Page" CASCADE;
DROP TABLE IF EXISTS "MenuItem" CASCADE;
DROP TABLE IF EXISTS "ChallengeSetting" CASCADE;
DROP TABLE IF EXISTS "Setting" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Tabela system Prismy musi pozostać
-- Następnie uruchom: npm run migrate
```

### Opcja B: Nowa baza na Neon

1. Przejdź na https://console.neon.tech
2. Usuń stary project
3. Stwórz nowy project
4. Skopiuj nową `DATABASE_URL` do `.env.local`
5. Uruchom: `npm run migrate`

---

## ✅ Weryfikacja Po Czyszczeniu

Sprawdź czy baza jest pusta:

```bash
npx prisma studio
```

- Powinno być wszystko puste
- Albo jeśli zrobiłeś `npm run seed`, powinna być strona główna i domyślne usługi

---

## 🚨 WAŻNE UWAGI

### Neon + Netlify

Jeśli używasz **Neon bezpośrednio z Netlify**:

1. **Disconnectuj wszystkie connections** przed czyszczeniem:
   - Wejdź w Neon Console → Pool connections
   - Ustaw pool na minimum
   - Czekaj 30 sekund

2. **Czyszczenie skryptem**:
   ```bash
   npm run migrate
   ```

3. **Redeploy na Netlify**:
   ```bash
   git add -A
   git commit -m "reset: clear database for fresh start"
   git push
   ```

### Jeśli gdzieś jest błąd

Jeśli widzisz błąd typu:
- `connection timeout`
- `permission denied`
- `connection refused`

**Czekaj kilka minut** - połączenia w bazie muszą być zamknięte.

---

## 📊 Struktura Po Czyszczeniu

Po `npm run migrate` powinna być:

```
Setting (id=1)
├── navbar_sticky: true
├── navbar_font_size: 16
└── ... (domyślne ustawienia)

Page (strona główna)
├── slug: "" / "strona-glowna"
├── title: "Strona główna"
└── is_in_menu: false

ServiceType (jeśli seed)
├── Sesja Fotograficzna
├── Kurs Fotografii
└── ...
```

---

## 🎯 Co Dalej?

1. **Zaloguj się w admin**: `/admin`
2. **Skonfiguruj ustawienia**: `/admin/settings`
3. **Dodaj strony**: `/admin/pages`
4. **Dodaj usługi**: `/admin/services`
5. **Zacznij pracę!**

---

## 💡 Porady

### Backup Przed Czyszczeniem

Jeśli martwisz się stracisz dane, zrób backup:

```bash
# Eksportuj dane z Neon
pg_dump postgresql://user:password@host/db > backup.sql
```

Potem możesz je przywrócić:

```bash
psql postgresql://user:password@host/db < backup.sql
```

### Jeśli Coś Pójdzie Nie Tak

1. Sprawdź logi:
   ```bash
   npm run migrate -- --verbose
   ```

2. Przywróć backup:
   ```bash
   psql postgresql://... < backup.sql
   ```

3. Skontaktuj się ze mną 📧

---

**Powodzenia! 🚀**
