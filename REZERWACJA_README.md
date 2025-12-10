# 📸 System Rezerwacji - Dokumentacja Konsultanta

## 🎯 Przegląd Systemu

System rezerwacji to w pełni integrowana platforma do zarządzania rezerwacjami sesji fotograficznych. Obejmuje:
- **Frontend**: Piękna strona rezerwacji dla klientów (`/rezerwacja`)
- **Admin Panel**: Panel zarządzania pakietami (`/admin/rezerwacja`)
- **Backend**: REST API endpoints do zarządzania danymi
- **Baza Danych**: PostgreSQL z tabelami ServiceType, Package, Booking

---

## 🏗️ Architektura

### Struktura Danych

```
ServiceType (Typ Usługi)
├── id: number
├── name: string (np. "Sesja", "Ślub", "Przyjęcie")
├── icon: string (emoji, np. "📸")
├── description: string
├── is_active: boolean
└── packages: Package[]
    ├── id: number
    ├── name: string (np. "Złoty", "Srebrny")
    ├── icon: string (emoji)
    ├── price: number (w groszach, np. 19900 = 199zł)
    ├── hours: number (2, 4, 8)
    ├── subtitle: string (np. "2h sesji")
    ├── features: string (JSON array)
    ├── is_active: boolean
    └── order: number

BookingSettings (Ustawienia Rezerwacji)
├── booking_require_payment: boolean (czy wymagana płatność?)
├── booking_payment_method: string ("stripe" lub "payu")
├── booking_currency: string ("PLN", "EUR", etc.)
└── booking_min_days_ahead: number (np. 7 = min. 7 dni naprzód)

Booking (Rezerwacja Klienta)
├── id: number
├── service: string
├── package: string
├── price: number
├── date: date
├── start_time: time
├── end_time: time
├── client_name: string
├── email: string
├── phone: string
├── venue_city: string
├── venue_place: string
├── notes: string
├── status: enum (pending, confirmed, paid, cancelled)
└── created_at: timestamp
```

---

## 🖥️ Frontend - Strona Rezerwacji (`/rezerwacja`)

### URL
```
https://wlasniewski.pl/rezerwacja
```

### Wygląd & Flow

Strona podzielona na **4 kroki** (progressive disclosure):

#### **Krok 1: Wybór Usługi**
- Kafelki z ikonami emoji
- Wybór domyślnie ustawiony na pierwszą usługę
- Kolory: gold border przy wyborze, hover efekty

#### **Krok 2: Wybór Pakietu**
- Karty pakietów w siatce 3-kolumnowej (na mobile 1)
- Każda karta pokazuje:
  - Emoji ikona pakietu
  - Nazwa pakietu
  - Cena (w PLN lub innej walucie z settings)
  - Liczba godzin
  - Top 3 features (spunktowane)
- Wybrany pakiet ma gold border i scale-up animation

#### **Krok 3: Wybór Terminu**
- Komponent BookingCalendar
- Pokazuje dostępne terminy
- Można wybrać datę i (opcjonalnie) godzinę

#### **Krok 4: Formularz Danych**
- **Pola obowiązkowe**: Imię, Email, Termin, Pakiet, RODO
- **Pola opcjonalne**: Telefon, Notatki
- **Pola warunkowe**: Jeśli usługa = "Ślub", "Przyjęcie" lub "Urodziny" → pojawiają się pola Miasto i Miejsce (obowiązkowe)

#### **Podsumowanie**
- Przezroczysty box z:
  - Nazwą usługi
  - Nazwą pakietu
  - Ceną do zapłaty
- Przycisk submit:
  - Jeśli `booking_require_payment = true` → "💳 Przejdź do Płatności"
  - Jeśli `booking_require_payment = false` → "✅ Potwierdź Rezerwację"

#### **Po Submissji**
```javascript
// Jeśli płatność WYMAGANA:
toast.success('✅ Rezerwacja utworzona! Przejdź do płatności...');
// TODO: redirect to /rezerwacja/platnosc?booking_id=123

// Jeśli BRAK płatności:
toast.success('✅ Rezerwacja potwierdzona! Email wysłany.');
window.location.href = '/rezerwacja/potwierdzenie';
```

### Załadowanie Danych
```typescript
// 1. Fetch service types + packages
GET /api/service-types
// Response: { serviceTypes: ServiceType[] }

// 2. Fetch booking settings
GET /api/settings/booking
// Response: { settings: { 
//   require_payment: boolean, 
//   payment_method: string,
//   currency: string,
//   min_days_ahead: number
// }}
```

### Styl & Responsywność
- **Kolory**: Black background, zinc-900/800 cards, amber-500 accents
- **Font**: "text-white", "font-bold", "text-3xl" dla nagłówków
- **Rounded**: "rounded-3xl" dla sekcji, "rounded-2xl" dla kafelków
- **Breakpoints**: Mobile-first, md (768px), lg (1024px)
- **Animacje**: Sonner toasts (top-right), hover scale, border transitions

---

## 👨‍💼 Admin Panel - Zarządzanie Pakietami (`/admin/rezerwacja`)

### Dostęp
```
/admin/rezerwacja
```
*Wymaga logowania (JWT token)*

### Funkcjonalność

#### **1. Lista Usług**
Dla każdej usługi wyświetla się karta z:
- Ikoną emoji + nazwą
- Opisem
- Przycisk "Edytuj usługę"
- Grid pakietów (3-kolumnowy)

#### **2. Zarządzanie Pakietami**

**Wyświetlanie pakietu (karta):**
- Emoji + nazwa + cena + godziny
- Status badge (Aktywny/Nieaktywny)
- Przycisk "Edytuj" → otwiera modal
- Przycisk "Usuń" → confirmation dialog

**Edycja pakietu (modal):**
- Nazwa pakietu
- Emoji ikona
- Godziny (number input)
- Cena w PLN (number input)
- Opis krótki (subtitle)
- Opis pełny (textarea)
- Checkbox "Pakiet aktywny"
- Przyciski: Anuluj | Zapisz

**Dodawanie pakietu:**
Przycisk "➕ Dodaj pakiet do [Nazwa Usługi]" tworzy nowy pakiet z:
```typescript
{
  id: 0,
  service_id: service.id,
  name: '',
  icon: '📦',
  description: '',
  hours: 1,
  price: 0,
  subtitle: '',
  features: '[]',
  order: lastOrder + 1,
  is_active: true
}
```

#### **3. API Calls (Admin)**

**Załadowanie pakietów:**
```http
GET /api/service-types
Headers: Authorization: Bearer {token}
Response: { serviceTypes: ServiceType[] }
```

**Dodanie/Edycja pakietu:**
```http
POST /api/packages
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: application/json
Body: {
  id?: number,
  service_id: number,
  name: string,
  icon: string,
  description: string,
  hours: number,
  price: number,
  subtitle: string,
  features: string (JSON),
  is_active: boolean
}
Response: { success: true, package: Package }
```

**Usunięcie pakietu:**
```http
DELETE /api/packages?id={id}
Headers: Authorization: Bearer {token}
Response: { success: true }
```

---

## 🔌 API Endpoints

### Public Endpoints (bez autentykacji)

#### 1. **GET /api/service-types**
Pobiera wszystkie aktywne usługi z pakietami.
```javascript
// Request
fetch('/api/service-types')

// Response
{
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
          "subtitle": "2h sesji",
          "features": "[\"Edycja zdjęć\", \"Album PDF\"]",
          "is_active": true
        }
      ]
    }
  ]
}
```

#### 2. **GET /api/settings/booking**
Pobiera ustawienia rezerwacji.
```javascript
// Request
fetch('/api/settings/booking')

// Response
{
  "success": true,
  "settings": {
    "booking_require_payment": false,
    "booking_payment_method": "stripe",
    "booking_currency": "PLN",
    "booking_min_days_ahead": 7
  }
}
```

#### 3. **POST /api/bookings**
Tworzy nową rezerwację.
```javascript
// Request
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: "Sesja",
    package: "Złoty",
    hours: 2,
    price: 19900,
    date: "2025-12-20",
    start_time: "14:00",
    end_time: "16:00",
    name: "Jan Kowalski",
    email: "jan@example.com",
    phone: "+48123456789",
    venue_city: "Toruń",
    venue_place: "Park",
    notes: "Sesja rodzinna"
  })
})

// Response
{
  "ok": true,
  "booking": {
    "id": 123,
    "service": "Sesja",
    "package": "Złoty",
    "status": "pending",
    "created_at": "2025-12-10T15:30:00Z"
  }
}
```

### Protected Endpoints (wymagają JWT token w Authorization header)

#### 4. **GET /api/packages**
Pobiera wszystkie pakiety (z filtrem opcjonalnym).

#### 5. **POST /api/packages**
Tworzy lub aktualizuje pakiet.

#### 6. **DELETE /api/packages?id={id}**
Usuwa pakiet.

#### 7. **GET /api/service-types** (admin)
Pobiera usługi z pełnymi danymi dla admina.

#### 8. **POST /api/service-types**
Tworzy lub aktualizuje usługę.

---

## 📧 Email Notifications

### Automatyczne Emaile

#### **1. Email do Klienta**
```
Subject: ✨ Potwierdzenie rezerwacji - [Nazwa Usługi]
Content: 
- Potwierdzenie rezerwacji
- Detale sesji (data, czas, lokalizacja)
- Cena
- Link do strony (TODO)
```

#### **2. Email do Fotografa**
```
Subject: 🎉 Nowa rezerwacja: [Imię] - [Usługa] (data)
Content:
- Pełne dane klienta
- Detale sesji
- Cena
- Notatki dodatkowe
```

**Konfiguracja:**
- `ADMIN_EMAIL = "przemyslaw@wlasniewski.pl"` (w `/api/bookings/route.ts`)
- SMTP configured w `.env.local`

---

## ⚙️ Konfiguracja & Ustawienia

### Gdzie edytować ustawienia rezerwacji?

#### **Opcja 1: Bezpośrednio w panelu admina**
*(TODO: Dodać UI dla booking settings)*

Obecnie brakuje UI do edycji ustawień. Muszą być edytowane przez:

#### **Opcja 2: Bezpośrednie wstawienie w DB**
```sql
UPDATE setting SET 
  booking_require_payment = true,
  booking_payment_method = 'stripe',
  booking_currency = 'PLN',
  booking_min_days_ahead = 7
WHERE id = 1;
```

#### **Opcja 3: API call (z auth)**
```javascript
fetch('/api/settings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    booking_require_payment: true,
    booking_payment_method: 'stripe',
    booking_currency: 'PLN',
    booking_min_days_ahead: 7
  })
})
```

---

## 🎨 Customization

### Zmiana Waluty
```javascript
// W /api/settings/booking (lub bezpośrednio w DB)
booking_currency = 'EUR' // zamiast 'PLN'
```

### Zmiana Minimalnego Okresu Naprzód
```javascript
// Aby rezerwować min. 14 dni naprzód:
booking_min_days_ahead = 14
```

### Toggle Płatności
```javascript
// Jeśli chcesz wyłączyć płatność (tylko rezerwacja):
booking_require_payment = false

// Jeśli chcesz włączyć płatność:
booking_require_payment = true
booking_payment_method = 'stripe' // lub 'payu'
```

### Dodanie Nowej Usługi
1. Otwórz `/admin/rezerwacja`
2. (TODO: Dodać UI) Lub API:
```javascript
POST /api/service-types
{
  "name": "Połów",
  "icon": "🎣",
  "description": "Sesja nad morzem",
  "is_active": true
}
```

### Edycja Pakietu
1. Otwórz `/admin/rezerwacja`
2. Najedź na kafelek pakietu
3. Kliknij "Edytuj"
4. Zmień dane
5. Kliknij "Zapisz"

---

## 🚀 Deployment Checklist

- [ ] Rezerwacja strona testowana na mobile
- [ ] Admin panel testowany
- [ ] Service types + packages załadowane z danymi
- [ ] Booking settings skonfigurowane
- [ ] SMTP email configured
- [ ] Stripe (jeśli `require_payment = true`) initialized
- [ ] URL rezerwacji linkowany z głównej strony
- [ ] Potwierdzenie rezerwacji strona stworzona (`/rezerwacja/potwierdzenie`)
- [ ] Strona płatności stworzona (`/rezerwacja/platnosc`) - jeśli wymagana

---

## 🐛 Troubleshooting

### Problem: Brak pakietów na stronie rezerwacji
**Rozwiązanie:**
```bash
# 1. Sprawdź czy service types istnieją
curl http://localhost:3000/api/service-types

# 2. Sprawdź czy są aktywne (is_active = true)
# 3. Sprawdź czy mają packages

# 4. Reload strony rezerwacji (Ctrl+Shift+R)
```

### Problem: Ustawienia rezerwacji nie działają
**Rozwiązanie:**
```bash
# 1. Sprawdź czy settings istnieją w bazie
curl http://localhost:3000/api/settings/booking

# 2. Jeśli puste, wstaw manualne settings:
UPDATE setting SET 
  booking_require_payment = false,
  booking_payment_method = 'stripe',
  booking_currency = 'PLN',
  booking_min_days_ahead = 7
WHERE id = 1;

# 3. Reload strony
```

### Problem: Email nie jest wysyłany
**Rozwiązanie:**
```bash
# 1. Sprawdź czy SMTP configured w .env.local
# 2. Sprawdź czy ADMIN_EMAIL ustawiony w /api/bookings/route.ts
# 3. Sprawdź logi serwera (console.error)
# 4. Sprawdź czy booking został zapisany (query DB)
```

---

## 📞 Kontakt

- **Fotografka**: Przemysław Właśniewski
- **Email**: przemyslaw@wlasniewski.pl
- **Strona**: https://wlasniewski.pl

---

## 📝 Changelog

### v2.0 (2025-12-10)
- ✅ Nowa strona rezerwacji z 4-stopniowym formularzem
- ✅ Admin panel do zarządzania pakietami
- ✅ API endpoints dla service types, packages, bookings
- ✅ Automatyczne emaile
- ✅ Booking settings (currency, payment toggle, min days)
- ✅ Mobile-responsive design
- 🔲 Stripe integration (placeholder)
- 🔲 Confirmation page (`/rezerwacja/potwierdzenie`)
- 🔲 Payment page (`/rezerwacja/platnosc`)
- 🔲 Admin UI do edycji booking settings

---

**Ostatnia aktualizacja**: 10 grudnia 2025

