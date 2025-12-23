# 📸 System Rezerwacji - Dokumentacja Techniczna

> **Ostatnia aktualizacja**: 11 grudnia 2025  
> **Wersja**: 3.0

---

## 🎯 Przegląd Systemu

System rezerwacji to w pełni zintegrowana platforma do zarządzania rezerwacjami sesji fotograficznych z następującymi możliwościami:

- ✅ **Frontend klienta**: 4-krokowy proces rezerwacji (`/rezerwacja`)
- ✅ **Panel admina**: Zarządzanie pakietami i usługami (`/admin/rezerwacja`)
- ✅ **Backend API**: REST endpoints dla wszystkich operacji
- ✅ **Płatności**: Integracja Stripe Checkout
- ✅ **Promocje**: Kody promocyjne i karty podarunkowe
- ✅ **Dostępność**: Inteligentny system blokowania terminów
- ✅ **Emaile**: Automatyczne powiadomienia dla klienta i fotografa

---

## 🏗️ Architektura

### Stack Technologiczny

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (via Prisma ORM)
- **Styling**: TailwindCSS
- **Payments**: Stripe Checkout
- **Email**: SMTP (configured in `settings`)
- **UI Components**: Sonner (toasts), custom React components

### Struktura Plików

```
src/
├── app/
│   ├── rezerwacja/
│   │   └── page.tsx                    # [PUBLIC] Strona rezerwacji klienta
│   ├── admin/
│   │   └── rezerwacja/
│   │       └── page.tsx                # [ADMIN] Panel zarządzania pakietami
│   └── api/
│       ├── service-types/route.ts      # GET/POST/DELETE usługi
│       ├── packages/route.ts           # GET/POST/DELETE pakiety
│       ├── bookings/route.ts           # POST/GET/PATCH rezerwacje
│       ├── availability/route.ts       # GET dostępność godzin
│       ├── checkout/route.ts           # POST Stripe checkout session
│       ├── promo-codes/route.ts        # POST weryfikacja kodu
│       └── gift-cards/route.ts         # POST weryfikacja karty
├── components/
│   ├── BookingCalendar.tsx             # Kalendarz (legacy, nieużywany)
│   └── TestimonialsSection.tsx         # Sekcja referencji
└── lib/
    ├── email.ts                        # Funkcje wysyłki email
    └── email-templates.ts              # Szablony HTML emaili
```

---

## 💾 Baza Danych

### Model: `ServiceType` (Typ Usługi)

Główne kategorie usług (Sesja, Ślub, Przyjęcie, Urodziny itp.)

```prisma
model ServiceType {
  id          Int       @id @default(autoincrement())
  name        String    @unique            // "Sesja", "Ślub", "Przyjęcie"
  icon        String?                      // Emoji: "📸", "💍", "🎂"
  description String?
  order       Int       @default(0)
  is_active   Boolean   @default(true)
  
  // Relations
  packages    Package[]
}
```

**Przykładowe dane:**

| id | name | icon | description |
|----|------|------|-------------|
| 1 | Sesja | 📸 | Profesjonalna sesja fotograficzna |
| 2 | Ślub | 💍 | Reportaż ślubny |
| 3 | Przyjęcie | 🎉 | Fotografia eventowa |

---

### Model: `Package` (Pakiet)

Pakiety cenowe dla każdego typu usługi.

```prisma
model Package {
  id                 Int      @id @default(autoincrement())
  service_id         Int                             // FK → ServiceType
  name               String                          // "Złoty", "Srebrny", "Platynowy"
  icon               String?                         // Emoji: "⭐", "💎"
  description        String?                         // Opis HTML/plain text
  hours              Int                             // Długość sesji (1, 2, 4, 8)
  price              Int                             // Cena w GROSZACH (19900 = 199 zł)
  subtitle           String?                         // "2h sesji + edycja"
  features           String?                         // JSON: ["Edycja zdjęć", "Album PDF"]
  available_hours    String?                         // "9,10,11,12,13,14,15,16,17"
  blocks_entire_day  Boolean? @default(false)        // true = ślub (blokuje cały dzień)
  order              Int      @default(0)
  is_active          Boolean  @default(true)
  
  // Relations
  service            ServiceType @relation(...)
}
```

**Kluczowe pola:**
- `price`: **ZAWSZE w groszach** (np. 29900 = 299 zł)
- `blocks_entire_day`: `true` dla ślubu/przyjęcia → blokuje cały dzień
- `available_hours`: Godziny dostępności (CSV format)

---

### Model: `Booking` (Rezerwacja)

Przechowuje rezerwacje klientów.

```prisma
model Booking {
  id             Int      @id @default(autoincrement())
  service        String                              // Nazwa usługi
  package        String                              // Nazwa pakietu
  price          Int                                 // Finalna cena (po rabatach)
  date           DateTime                            // Data sesji
  start_time     String?                             // "14:00"
  end_time       String?                             // "16:00"
  client_name    String
  email          String
  phone          String?
  venue_city     String?                             // Dla ślubu/przyjęcia
  venue_place    String?                             // Dla ślubu/przyjęcia
  notes          String?
  promo_code     String?
  gift_card_code String?
  status         String   @default("pending")        // pending, confirmed, paid, cancelled
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}
```

**Statusy rezerwacji:**
- `pending` – Utworzona, czeka na płatność
- `confirmed` – Potwierdzona (gdy płatność niewymagana)
- `paid` – Opłacona (Stripe)
- `cancelled` – Anulowana

---

## 🌐 Frontend - Strona Rezerwacji (`/rezerwacja`)

### URL
```
https://wlasniewski.pl/rezerwacja
```

### 4-Krokowy Proces Rezerwacji

#### **Krok 1: Wybór Usługi**
- Kafelki z emoji i opisem każdej usługi
- Wybór domyślnie na pierwszej aktywnej usłudze
- **Wygląd**: Złoty border przy wyborze, hover efekty

#### **Krok 2: Wybór Pakietu**
- Siatka 3-kolumnowa (mobile: 1 kolumna)
- Wyświetlane dane:
  - Emoji ikona
  - Nazwa pakietu
  - Cena (formatowana z `/100`)
  - Liczba godzin
  - Opis (`subtitle`)
- **Interakcja**: Gold border + scale-up animation przy wyborze

#### **Krok 3: Wybór Terminu i Godziny**
- Kalendarz z wybranym miesiącem
- Po wyborze daty → automatyczne ładowanie dostępnych godzin
- **System dostępności**:
  - Fetch: `GET /api/availability?serviceId=X&packageId=Y&date=YYYY-MM-DD`
  - Wyświetla godziny 0-23 z oznaczeniem dostępności
  - Niedostępne godziny: wyszarzone z powodem (`booked_session`, `booked_event`, `outside_hours`)

#### **Krok 4: Formularz Danych**

**Pola obowiązkowe:**
- Imię i nazwisko
- Email
- RODO (checkbox)

**Pola opcjonalne:**
- Telefon
- Uwagi

**Pola warunkowe** (jeśli usługa = Ślub/Przyjęcie/Urodziny):
- Miasto (wymagane)
- Miejsce (wymagane)

**Promocje:**
- Kod promocyjny → weryfikacja przez `POST /api/promo-codes`
- Karta podarunkowa → weryfikacja przez `POST /api/gift-cards`
- Wyświetlenie rabatu i końcowej ceny

**Przycisk submit:**
- "💳 Przejdź do Płatności"
- Tworzy rezerwację → przekierowuje do Stripe Checkout

---

### Flow po Submissji

```javascript
1. POST /api/bookings → tworzy booking (status: pending)
2. POST /api/checkout → tworzy Stripe Checkout Session
   - Jeśli sukces → redirect na Stripe URL
   - Jeśli brak Stripe setup → fallback alert i przekierowanie na /rezerwacja/potwierdzenie
3. Email automatyczny:
   - Dla klienta: Potwierdzenie rezerwacji
   - Dla admina: Powiadomienie o nowej rezerwacji
```

---

## 🛠️ Panel Admina (`/admin/rezerwacja`)

### Dostęp
```
/admin/rezerwacja
```
*Brak autentykacji (zgodnie z wcześniejszym usunięciem auth dla tego endpointa)*

### Funkcjonalności

#### 1. **Lista Usług**
- Wyświetla wszystkie `ServiceType` z pakietami
- Dla każdej usługi:
  - Ikona emoji + nazwa + opis
  - Przycisk "Edytuj usługę" (otwiera modal)
  - Grid pakietów (3 kolumny)

#### 2. **Zarządzanie Pakietami**

**Karta pakietu:**
- Emoji + Nazwa + Cena + Godziny
- Badge statusu (Aktywny/Nieaktywny)
- Przyciski:
  - "Edytuj" → otwiera modal edycji
  - "Usuń" → confirmation dialog

**Modal - Edycja/Tworzenie pakietu:**
- **Pola**:
  - Nazwa (text)
  - Emoji (text)
  - Godziny (number)
  - Cena w PLN (number) - **uwaga**: zapisywana w groszach na backendzie
  - Opis krótki (`subtitle`)
  - Opis pełny (`description`)
  - Dostępne godziny (`available_hours`) - format CSV: "9,10,11,12,13,14,15,16,17"
  - Checkbox: "Blokuje cały dzień"
  - Checkbox: "Pakiet aktywny"
- **Akcje**:
  - Anuluj
  - Zapisz → `POST /api/packages`

**Dodawanie pakietu:**
- Przycisk "➕ Dodaj pakiet do [Nazwa Usługi]"
- Tworzy pusty pakiet z domyślnymi wartościami:
  ```typescript
  {
    id: 0,
    service_id: service.id,
    name: '',
    icon: '📦',
    hours: 1,
    price: 0,
    order: lastOrder + 1,
    is_active: true
  }
  ```

---

## 🔌 API Endpoints

### **Public Endpoints** (bez autentykacji)

#### `GET /api/service-types`
Pobiera wszystkie aktywne usługi z pakietami.

**Request:**
```http
GET /api/service-types
```

**Response (200 OK):**
```json
{
  "success": true,
  "serviceTypes": [
    {
      "id": 1,
      "name": "Sesja",
      "icon": "📸",
      "description": "Profesjonalna sesja fotograficzna",
      "is_active": true,
      "packages": [
        {
          "id": 1,
          "name": "Złoty",
          "icon": "⭐",
          "price": 19900,
          "hours": 2,
          "subtitle": "2h sesji + edycja",
          "features": "[\"Edycja zdjęć\", \"Album PDF\"]",
          "is_active": true
        }
      ]
    }
  ]
}
```

---

#### `GET /api/availability`
Sprawdza dostępność godzin dla danej daty i pakietu.

**Request:**
```http
GET /api/availability?serviceId=1&packageId=2&date=2025-12-20
```

**Response (200 OK):**
```json
{
  "success": true,
  "date": "2025-12-20",
  "dayOfWeek": 6,
  "isWeekend": true,
  "packageName": "Złoty",
  "packageHours": 2,
  "dayCompletelyBlocked": false,
  "slots": [
    { "hour": 9, "available": true },
    { "hour": 10, "available": true },
    { "hour": 11, "available": false, "reason": "booked_session" },
    { "hour": 12, "available": false, "reason": "booked_session" },
    { "hour": 13, "available": true }
  ]
}
```

**Logika dostępności:**
1. **Ślub/Przyjęcie/Urodziny** (`blocks_entire_day = true`) → blokuje cały dzień (wszystkie godziny 0-23)
2. **Sesja** → blokuje tylko godziny w zakresie `start_time` – `end_time`
3. Jeśli dzień zajęty przez wydarzenie → `dayCompletelyBlocked: true`, wszystkie sloty z `reason: "booked_event"`

---

#### `POST /api/bookings`
Tworzy nową rezerwację.

**Request:**
```http
POST /api/bookings
Content-Type: application/json

{
  "service": "Sesja",
  "package": "Złoty",
  "hours": 2,
  "price": 19900,
  "originalPrice": 19900,
  "date": "2025-12-20",
  "start_time": "14:00",
  "end_time": "16:00",
  "name": "Jan Kowalski",
  "email": "jan@example.com",
  "phone": "+48123456789",
  "venue_city": null,
  "venue_place": null,
  "notes": "Sesja rodzinna",
  "promo_code": null,
  "gift_card_code": null,
  "ics": "<ICS calendar attachment>"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "booking": {
    "id": 123,
    "service": "Sesja",
    "package": "Złoty",
    "status": "pending",
    "created_at": "2025-12-11T08:00:00Z"
  }
}
```

**Side effects:**
1. Wysłanie emaila do klienta (potwierdzenie)
2. Wysłanie emaila do admina (powiadomienie o nowej rezerwacji)

---

#### `POST /api/checkout`
Tworzy sesję Stripe Checkout.

**Request:**
```http
POST /api/checkout
Content-Type: application/json

{
  "bookingId": 123,
  "amount": 19900,
  "email": "jan@example.com",
  "serviceName": "Sesja",
  "packageName": "Złoty"
}
```

**Response (200 OK):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Frontend handling:**
```javascript
if (checkoutRes.ok) {
  const { url } = await checkoutRes.json();
  window.location.href = url; // Przekierowanie na Stripe
}
```

---

### **Admin Endpoints** (częściowe auth - zobacz uwagi)

#### `POST /api/packages`
Tworzy lub aktualizuje pakiet.

**Request:**
```http
POST /api/packages
Content-Type: application/json

{
  "id": 0,                    // 0 = nowy, >0 = update
  "service_id": 1,
  "name": "Platynowy",
  "icon": "👑",
  "description": "Premium package",
  "hours": 4,
  "price": 499,              // Admin podaje PLN, backend konwertuje na grosze
  "subtitle": "4h + album",
  "features": "[\"Edycja\", \"Album\", \"Pendrive\"]",
  "available_hours": "9,10,11,12,13,14,15,16,17",
  "blocks_entire_day": false,
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "package": { ... }
}
```

> **Uwaga**: Price conversion - admin wpisuje `499` (PLN), backend zapisuje jako `49900` (grosze)

---

#### `DELETE /api/packages?id={id}`
Usuwa pakiet.

**Request:**
```http
DELETE /api/packages?id=5
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## 📧 Email Notifications

### Konfiguracja SMTP

Ustawienia przechowywane w tabeli `settings`:
- `smtp_host`
- `smtp_port`
- `smtp_user`
- `smtp_password`
- `smtp_from`

### Email do Klienta

**Subject**: `✨ Potwierdzenie rezerwacji - {service}`

**Template**: `generateClientEmail()` z `@/lib/email-templates`

**Zawiera**:
- Potwierdzenie danych rezerwacji
- Data i godzina sesji
- Lokalizacja (jeśli podana)
- Cena (oryginalna + po rabatach)
- Kod promocyjny / Karta podarunkowa (jeśli użyta)
- Link do strony (TODO)

### Email do Fotografa

**Subject**: `🎉 Nowa rezerwacja: {name} - {service} ({date})`

**Template**: `generateAdminEmail()` z `@/lib/email-templates`

**Zawiera**:
- Pełne dane klienta (imię, email, telefon)
- Szczegóły sesji
- Cena i rabaty
- Notatki klienta

**Admin email**: `przemyslaw@wlasniewski.pl` (hardcoded w `/api/bookings/route.ts`)

---

## 💳 Integracja Stripe

### Setup

**Wymagane zmienne środowiskowe:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Przechowywane również w tabeli `settings`:
- `stripe_secret_key`
- `stripe_publishable_key`
- `stripe_webhook_secret`

### Checkout Flow

1. **Klient wypełnia formularz** → `POST /api/bookings` (tworzy booking ze statusem `pending`)
2. **Backend tworzy sesję Stripe** → `POST /api/checkout`
   - Line item: nazwa pakietu, cena (w groszach), quantity: 1
   - Success URL: `/rezerwacja/potwierdzenie?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `/rezerwacja?cancelled=true`
3. **Redirect na Stripe Checkout**
4. **Po płatności**:
   - Stripe webhook → aktualizacja statusu booking na `paid`
   - Przekierowanie na `/rezerwacja/potwierdzenie`

> **TODO**: Webhook handler dla Stripe (`/api/webhooks/stripe`) - obecnie brak implementacji

---

## 🎟️ Rabaty: Kody Promocyjne i Karty Podarunkowe

### Kody Promocyjne

**Model**: `PromoCode`

**API**: `POST /api/promo-codes`

**Request:**
```json
{
  "code": "ZIMA2025"
}
```

**Response (200 OK):**
```json
{
  "promo_code": {
    "code": "ZIMA2025",
    "discount_value": 20,
    "discount_type": "percentage"
  }
}
```

**Typy rabatów:**
- `percentage`: Procent (np. `20` = 20%)
- `fixed`: Kwota stała w PLN (np. `50` = 50 zł rabatu)

**Zastosowanie w kalkulacji ceny:**
```typescript
let price = chosenPackage.price; // w groszach

if (discount.type === "percentage") {
  price -= Math.floor((price * discount.value) / 100);
} else {
  price -= discount.value * 100; // Convert PLN to cents
}
```

### Karty Podarunkowe

**Model**: `GiftCard`

**API**: `POST /api/gift-cards`

**Request:**
```json
{
  "code": "GIFT-ABCD-1234"
}
```

**Response (200 OK):**
```json
{
  "gift_card": {
    "code": "GIFT-ABCD-1234",
    "amount": 100,
    "is_used": false
  }
}
```

**Zastosowanie w kalkulacji:**
```typescript
if (giftCard) {
  price -= giftCard.amount * 100; // Convert PLN to cents
}

finalPrice = Math.max(0, price); // Cena nie może być ujemna
```

---

## ⚙️ Konfiguracja i Ustawienia

### Booking Settings

Przechowywane w tabeli `Setting` (single row, id=1):

| Pole | Typ | Domyślna | Opis |
|------|-----|----------|------|
| `booking_require_payment` | Boolean | `false` | Czy płatność wymagana? |
| `booking_payment_method` | String | `"stripe"` | Metoda płatności: `stripe` lub `payu` |
| `booking_currency` | String | `"PLN"` | Waluta |
| `booking_min_days_ahead` | Int | `7` | Min. dni naprzód do rezerwacji |
| `booking_terms_url` | String | - | URL do regulaminu |

### Edycja ustawień

**Opcja 1: Bezpośrednio w bazie danych**
```sql
UPDATE settings SET 
  booking_require_payment = true,
  booking_payment_method = 'stripe',
  booking_currency = 'PLN',
  booking_min_days_ahead = 7
WHERE id = 1;
```

**Opcja 2: TODO - Panel admina**
Obecnie brak UI do edycji `booking_*` settings w panelu admina. Konieczne dodanie sekcji w `/admin/settings` lub `/admin/rezerwacja`.

---

## 🐛 Troubleshooting

### Problem: Brak pakietów na stronie rezerwacji

**Rozwiązanie:**
```bash
# 1. Sprawdź czy service types istnieją
curl http://localhost:3000/api/service-types

# 2. Sprawdź czy są aktywne (is_active = true)
# 3. Sprawdź czy mają packages
# 4. Sprawdź czy packages są aktywne

# 5. Reload strony (Ctrl+Shift+R)
```

**SQL debug:**
```sql
SELECT st.name, st.is_active, COUNT(p.id) as package_count
FROM service_types st
LEFT JOIN packages p ON p.service_id = st.id AND p.is_active = true
GROUP BY st.id;
```

---

### Problem: Godziny nie ładują się po wyborze daty

**Możliwe przyczyny:**
1. Błąd API `/api/availability`
2. Brak `packageId` w parametrach
3. Błąd formatu daty (wymagane: `YYYY-MM-DD`)

**Debug:**
```javascript
// Otwórz DevTools → Network
// Sprawdź request do /api/availability
// Powinien być status 200 i JSON z `slots`

// Przykład:
GET /api/availability?serviceId=1&packageId=2&date=2025-12-20
```

**Backend logs:**
```bash
npm run dev
# Sprawdź console dla błędów prisma
```

---

### Problem: Email nie jest wysyłany

**Rozwiązanie:**
```bash
# 1. Sprawdź SMTP settings w bazie
SELECT smtp_host, smtp_port, smtp_user FROM settings WHERE id = 1;

# 2. Sprawdź czy ADMIN_EMAIL ustawiony w /api/bookings/route.ts
# Aktualnie: "przemyslaw@wlasniewski.pl"

# 3. Sprawdź logi serwera
# Console.error powinien pokazać błąd wysyłki

# 4. Test SMTP connection
# TODO: Dodać endpoint /api/test-email
```

---

### Problem: Stripe redirect nie działa

**Możliwe przyczyny:**
1. Brak `STRIPE_SECRET_KEY` w `.env`
2. Niepoprawny `bookingId`
3. Błąd tworzenia Checkout Session

**Debug:**
```javascript
// Sprawdź response z /api/checkout
const checkoutRes = await fetch('/api/checkout', { ... });
const data = await checkoutRes.json();
console.log(data); // Powinno mieć { url: "..." }
```

**Fallback behavior:**
Jeśli Stripe nie jest skonfigurowany:
```javascript
alert("✅ Rezerwacja utworzona!\n\nPrzejdź do panelu aby dokonać płatności.");
window.location.href = "/rezerwacja/potwierdzenie";
```

---

## 🎨 Customization

### Zmiana Waluty
```sql
UPDATE settings SET booking_currency = 'EUR' WHERE id = 1;
```
Frontend automatycznie wyświetli walutę z settings.

### Zmiana Minimalnego Okresu Rezerwacji
```sql
UPDATE settings SET booking_min_days_ahead = 14 WHERE id = 1;
```

### Toggle Płatności (włącz/wyłącz)
```sql
-- Wyłącz płatność (tylko rezerwacja)
UPDATE settings SET booking_require_payment = false WHERE id = 1;

-- Włącz płatność
UPDATE settings SET booking_require_payment = true WHERE id = 1;
```

**Efekt na frontend:**
- `false` → Przycisk: "✅ Potwierdź Rezerwację"
- `true` → Przycisk: "💳 Przejdź do Płatności"

### Dodanie Nowej Usługi

**Opcja 1: Panel admina**
1. TODO: Brak UI do dodawania `ServiceType`
2. Obecnie trzeba edytować bezpośrednio w bazie

**Opcja 2: SQL**
```sql
INSERT INTO service_types (name, icon, description, "order", is_active)
VALUES ('Chrzest', '👼', 'Fotografia chrzcin', 4, true);
```

---

## 🚀 Deployment Checklist

- [ ] **Database**
  - [ ] Service types załadowane z danymi
  - [ ] Packages załadowane z danymi (aktywne)
  - [ ] Booking settings skonfigurowane
- [ ] **Email**
  - [ ] SMTP configured w `settings`
  - [ ] ADMIN_EMAIL poprawnie ustawiony
  - [ ] Test email wysyłany poprawnie
- [ ] **Payments**
  - [ ] Stripe keys w `.env` (production)
  - [ ] Webhook URL skonfigurowany w Stripe Dashboard
  - [ ] Test płatności przeprowadzony
- [ ] **Frontend**
  - [ ] Strona `/rezerwacja` testowana na mobile
  - [ ] Strona `/rezerwacja/potwierdzenie` stworzona
  - [ ] Link `/rezerwacja` dodany do menu głównego
- [ ] **Admin Panel**
  - [ ] `/admin/rezerwacja` testowany
  - [ ] CRUD pakietów działa poprawnie

---

## 🔄 Changelog

### v3.0 (2025-12-11)
- ✅ **Nowa strona rezerwacji** z 4-krokowym formularzem
- ✅ **Inteligentny system dostępności** (blokowanie całego dnia vs godziny)
- ✅ **Admin panel** do zarządzania pakietami i usługami
- ✅ **API endpoints** dla wszystkich operacji CRUD
- ✅ **Stripe integration** - Checkout flow
- ✅ **Kody promocyjne** i **karty podarunkowe**
- ✅ **Automatyczne emaile** (klient + admin)
- ✅ **Mobile-responsive design**
- 🔲 TODO: Webhook handler dla Stripe
- 🔲 TODO: Strona `/rezerwacja/potwierdzenie`
- 🔲 TODO: Admin UI do edycji `booking_*` settings
- 🔲 TODO: Admin UI do CRUD `ServiceType`

### v2.0 (2025-12-10)
- ✅ Initial version with basic booking system

---

## 📞 Kontakt

**Fotografka**: Przemysław Właśniewski  
**Email**: przemyslaw@wlasniewski.pl  
**Strona**: https://wlasniewski.pl

---

## 🔍 Appendix: Kluczowe Pliki

| Plik | Opis |
|------|------|
| `src/app/rezerwacja/page.tsx` | Główna strona rezerwacji (4 kroki) |
| `src/app/admin/rezerwacja/page.tsx` | Panel admina - zarządzanie pakietami |
| `src/app/api/bookings/route.ts` | API rezerwacji + email notifications |
| `src/app/api/availability/route.ts` | Logika dostępności godzin |
| `src/app/api/service-types/route.ts` | CRUD dla usług |
| `src/app/api/packages/route.ts` | CRUD dla pakietów |
| `src/app/api/checkout/route.ts` | Stripe Checkout Session |
| `src/lib/email-templates.ts` | Szablony HTML emaili |
| `prisma/schema.prisma` | Definicje modeli DB |

---

**Koniec dokumentacji** ✅
