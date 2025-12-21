# ARCHITEKTURA STRONY wlasniewski.pl

**Kompletny przewodnik dla początkujących programistów**

> 📚 Ten dokument wyjaśnia KR

OK PO KROKU jak działa cała strona, od frontendu do bazy danych.
> 
> Cel: Zrozumieć KAŻDY element systemu i być w stanie zweryfikować jego poprawne działanie.

---

## 📋 SPIS TREŚCI

1. [Tech Stack - Czego Używamy](#tech-stack)
2. [Struktura Projektu](#struktura-projektu)
3. [Przepływ Danych](#przepływ-danych)
4. [Komponenty Systemu](#komponenty-systemu)
5. [Baza Danych](#baza-danych)
6. [Deployment](#deployment)
7. [Procedury Weryfikacji](#procedury-weryfikacji)

---

## 🛠️ TECH STACK

### Frontend (Co Widzi Użytkownik)
- **Next.js 15** - Framework React do budowy stron
  - SSR (Server-Side Rendering) - Strona renderuje się na serwerze
  - Static Generation - Niektóre strony są pre-renderowane
- **React 19** - Biblioteka do budowy interfejsów
- **Tailwind CSS** - Klasy CSS do stylowania
- **TypeScript** - JavaScript z typami (bezpieczniejszy kod)

### Backend (Logika Biznesowa)
- **Next.js API Routes** - Endpointy API w folderze `/api`
- **Prisma ORM** - Komunikacja z bazą danych
- **PostgreSQL (Neon)** - Baza danych w chmurze

### Hosting & Deployment
- **Netlify** - Hosting strony (automatyczny build z Git)
- **AWS S3** - Przechowywanie zdjęć/plików
- **Neon PostgreSQL** - Baza danych

---

## 📁 STRUKTURA PROJEKTU

```
wlasniewski.pl/
├── src/
│   ├── app/                    # STRONY (Next.js App Router)
│   │   ├── page.tsx           # Homepage (/)
│   │   ├── portfolio/         # Portfolio (/portfolio)
│   │   │   ├── page.tsx
│   │   │   └── [category]/[slug]/page.tsx
│   │   ├── admin/             # Panel admina (/admin)
│   │   ├── api/               # API ENDPOINTS
│   │   │   ├── gift-cards/
│   │   │   ├── portfolio/
│   │   │   └── settings/
│   │   └── layout.tsx         # Layout globalny
│   │
│   ├── components/            # KOMPONENTY REUŻYWALNE
│   │   ├── GiftCard.tsx
│   │   ├── HeroSlider.tsx
│   │   └── Navigation.tsx
│   │
│   ├── lib/                   # LOGIKA BIZNESOWA
│   │   ├── email/
│   │   │   ├── sender.ts      # Wysyłanie maili
│   │   │   └── giftCardTemplate.ts
│   │   ├── portfolio.ts       # Funkcje portfolio
│   │   └── prisma.ts          # Klient bazy danych
│   │
│   └── styles/                # STYLE CSS
│
├── prisma/
│   ├── schema.prisma          # ⚠️ DEFINICJA BAZY DANYCH
│   └── migrations/            # Historia zmian DB
│
├── public/
│   └── uploads/               # Zdjęcia (lokalnie)
│
├── scripts/                   # NARZĘDZIA
│   ├── backup-database.js     # Backup bazy
│   └── restore-database.js    # Restore bazy
│
├── .env                       # ZMIENNE ŚRODOWISKOWE (sekrety)
├── next.config.js             # Konfiguracja Next.js
└── package.json               # Zależności projektu
```

---

## 🔄 PRZEPŁYW DANYCH

### Przykład 1: Użytkownik Otwiera Stronę Portfolio

```
1. PRZEGLĄDARKA (User)
   ↓ HTTP Request: GET /portfolio
   
2. NETLIFY (Server)
   ↓ Uruchamia Next.js
   
3. src/app/portfolio/page.tsx
   ↓ Wywołuje fetchPortfolioData()
   
4. src/lib/portfolio.ts
   ↓ Używa Prisma Client
   
5. PRISMA
   ↓ SQL Query: SELECT * FROM portfolio_sessions
   
6. NEON DATABASE (PostgreSQL)
   ↓ Zwraca dane
   
7. PRISMA
   ↓ Konwertuje na JS obiekty
   
8. src/app/portfolio/page.tsx
   ↓ Renderuje HTML z danymi
   
9. NETLIFY
   ↓ Wysyła HTML do przeglądarki
   
10. PRZEGLĄDARKA
    → Wyświetla stronę użytkownikowi
```

### Przykład 2: Admin Dodaje Zdjęcie do Portfolio

```
1. ADMIN PANEL
   → Wypełnia formularz + wybiera zdjęcie
   ↓ POST /api/portfolio
   
2. src/app/api/portfolio/route.ts
   ↓ Waliduje dane
   ↓ Upload zdjęcia do S3
   
3. AWS S3
   ↓ Zwraca URL zdjęcia
   
4. src/app/api/portfolio/route.ts
   ↓ prisma.portfolioSession.create({ ... })
   
5. NEON DATABASE
   ↓ INSERT INTO portfolio_sessions ...
   ↓ Zwraca created record
   
6. src/app/api/portfolio/route.ts
   ↓ Response: { success: true, id: 123 }
   
7. ADMIN PANEL
   → Pokazuje sukces, odświeża listę
```

---

## 🧩 KOMPONENTY SYSTEMU

### 1. Page Builder System

**Lokalizacja:** `src/app/admin/pages/[slug]/page.tsx`

**Co Robi:**
- Pozwala tworzyć i edytować strony dynamicznie
- Obsługuje różne typy bloków (hero, galeria, tekst)
- Zapisuje dane do tabeli `Page` i `PageSection`

**Jak Działa:**
```typescript
// 1. Użytkownik edytuje stronę w admin
// 2. Dane zapisywane do bazy:
await prisma.page.update({
  where: { slug: 'oferta' },
  data: {
    sections: {
      create: [
        { type: 'HERO', content: {...} },
        { type: 'GALLERY', content: {...} }
      ]
    }
  }
});

// 3. Frontend pobiera dane:
const page = await prisma.page.findUnique({
  where: { slug: 'oferta' },
  include: { sections: true }
});

// 4. Renderuje sekcje:
{page.sections.map(section => (
  <SectionRenderer type={section.type} data={section.content} />
))}
```

### 2. Gift Card System

**Komponenty:**
- `src/components/GiftCard.tsx` - Wizualizacja karty
- `src/app/api/gift-cards/[id]/send-email/route.ts` - Wysyłanie maila
- `src/lib/email/giftCardTemplate.ts` - Template HTML maila

**Przepływ:**
```
1. Klient kupuje kartę
2. Stripe/PayU przetwarza płatność
3. Webhook → /api/gift-cards/create
4. Tworzymy rekord w DB: GiftCard
5. Wysyłamy mail: /api/gift-cards/[id]/send-email
6. Template generuje HTML z danymi karty
7. SendGrid wysyła mail do odbiorcy
```

### 3. Portfolio System

**Tabele:**
- `PortfolioSession` - Sesje fotograficzne (grupowanie zdjęć)
- `GalleryPhoto` - Pojedyncze zdjęcia
- `Category` - Kategorie (Ślub, Portret, etc.)

**Relacje:**
```
Category (1) ─── (N) PortfolioSession
                        │
                        └── (N) GalleryPhoto
```

**API Endpoints:**
- `GET /api/portfolio` - Lista sesji
- `POST /api/portfolio` - Dodaj sesję
- `DELETE /api/portfolio/[id]` - Usuń sesję
- `POST /api/portfolio/[id]/photos` - Dodaj zdjęcia

### 4. Menu System

**Tabele:**
- `MenuItem` - Elementy menu

**Struktura:**
```json
{
  "id": 1,
  "label": "Portfolio",
  "href": "/portfolio",
  "order": 2,
  "parentId": null,     // null = główny poziom
  "children": [...]      // Podmenu (optional)
}
```

**Jak Renderować Menu:**
```typescript
const menuItems = await prisma.menuItem.findMany({
  where: { parentId: null },  // Główny poziom
  include: { children: true }, // Z podmenu
  orderBy: { order: 'asc' }
});

return (
  <nav>
    {menuItems.map(item => (
      <Link href={item.href}>{item.label}</Link>
    ))}
  </nav>
);
```

### 5. Drone Services System

**Lokalizacja:** `/dron` page + admin panel

**Tabele:**
- `DroneOrder` - Zamówienia usług dronowych

**Schema:**
```prisma
model DroneOrder {
  id           Int      @id @default(autoincrement())
  client_name  String
  company_name String?
  email        String
  phone        String?
  service_type String   // PV, ROOF, INDUSTRY, REAL_ESTATE, THERMAL
  details      String?
  status       String   @default("NEW")  // NEW, QUOTED, WON, LOST
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
}
```

**Typy Usług Dronowych:**
1. **PV (Photovoltaic)** - Inspekcje fotowolta iki termowizją
2. **ROOF** - Inspekcje dachów i pokryć
3. **INDUSTRY** - Inspekcje przemysłowe
4. **REAL_ESTATE** - Fotografia nieruchomości
5. **THERMAL** - Termowizja budynków

**Przepływ Zamówienia:**
```
1. Klient wypełnia formularz na /dron
   ↓ POST /api/drone/order
   
2. Tworzony jest rekord DroneOrder
   ↓ status = "NEW"
   
3. Admin widzi w /admin/drone
   ↓ Kontaktuje się z klientem
   
4. Aktualizuje status:
   NEW → QUOTED → WON/LOST
```

**API Endpoints:**
- `POST /api/drone/order` - Nowe zamówienie
- `GET /api/drone/orders` - Lista (admin)
- `PATCH /api/drone/orders/[id]` - Aktualizacja statusu

**Szczegółowa Implementacja Strony `/dron`:**

**Frontend (`src/app/dron/page.tsx`):**
- **Hero Section**: ThermalSlider component pokazujący porównanie zdjęć wizualnych vs. termowizyjnych
- **Services Grid**: 6 kart usług (PV, Dachy, Ciepłownictwo, Przemysł, Ortofotomapy, Nadzór)
- **Contact Form**: Formularz B2B (nazwa firmy, email, telefon, szczegóły projektu)

**Komponenty Używane:**
```typescript
// src/components/ThermalSlider.tsx
- Interactive slider pokazujący różnicę visual/thermal
- Before/After effect
- Obrazy z Unsplash (placeholder)

// ServiceCard component
- Icon (Lucide React)
- Title + Description
- Hover effect (border-yellow-500/30)
- Group hover animations
```

**Kluczowe Cechy:**
- **SEO Optimized**: Meta tags dla B2B (title, description)
- **Responsive**: Mobile-first design
- **Dark Theme**: bg-black + yellow accents
- **Call-to-Actions**: 2 buttons (Wycena + Poznaj ofertę)
- **Certyfikaty**: Badge z NSTS-01/02 uprawnieniami ULC

**Page Builder Integration:**
- Strona może być również zarządzana przez Page Builder
- Sekcje hero/gallery/text mogą być edytowane w `/admin/pages/dron`

### 9. Analytics & BI Dashboard (SZCZEGÓŁOWO)

**⚠️ UWAGA:** Obecna implementacja `/admin/analytics` to **BI Dashboard** (Business Intelligence - wykresy przychodów, cele, Scrum).  
**Poprzednio** była tam strona "licznik odwiedzin" (visitor tracking jak Google Analytics) - została zastąpiona.

**Tabele:**
- `AnalyticsEvent` - Zdarzenia śledzące (PAGE_VIEW, FORM_SUBMIT, etc.)
- `AnalyticsSnapshot` - Dzienne migawki przychodów
- `MarketingAction` - Akcje marketingowe
- `BusinessGoal` - Cele biznesowe (50k revenue, etc.)
- `ScrumTask` - Zadania operacyjne (tablica Kanban)

**Obecna Implementacja BI Dashboard:**

**Frontend (`src/app/admin/analytics/page.tsx` - 210 linii):**

**Struktura Strony:**
1. **Header**
   - Tytuł: "Business Analytics"
   - Przyciski: "Eksportuj Raport", "Nowy Cel"

2. **Stats Overview** (4 karty):
   ```typescript
   - Całkowity Przychód (totalRevenue + galleryRevenue)
   - Rezerwacje i Terminy (bookingsCount)
   - Karty Podarunkowe (giftCardsCount)  
   - Foto Wyzwania (challengesCount + acceptedChallenges)
   ```

3. **AnalyticsCharts Component**
   - Trajektoria przychodów (Line Chart - Recharts)
   - Realizacja celu 50k (Progress bar)
   - Revenue breakdown (Gift Cards vs Bookings)

4. **Business Goals Section**
   - Lista aktywnych celów
   - Progress bars
   - Deadline tracking

5. **ScrumBoard Component**
   - Tablica Kanban (TODO, IN_PROGRESS, DONE)
   - Marketing actions
   - Drag & drop tasks

**Backend (`src/app/api/analytics/summary/route.ts`):**

**Endpoint:** `GET /api/analytics/summary`

**Zwracane Dane:**
```typescript
{
  summary: {
    totalRevenue: number,      // Suma z bookings + gift cards
    galleryRevenue: number,    // Z prywatnych galerii
    bookingsCount: number,
    giftCardsCount: number,
    challengesCount: number,
    acceptedChallenges: number
  },
  chartData: [
    { month: string, revenue: number }  // Dla wykresów
  ],
  goals: [
    {
      id: number,
      title: string,
      target_value: number,
      current_value: number,
      deadline: Date,
      status: 'ACTIVE' | 'COMPLETED' | 'FAILED'
    }
  ]
}
```

**Komponenty Pomocnicze:**

**`src/components/admin/AnalyticsCharts.tsx`:**
- Używa `recharts` library
- `LineChart` - Trajektoria przychodów (ostatnie 6 miesięcy)
- `BarChart` - Porównanie źródeł przychodu
- Responsive design
- Dark theme styling

**`src/components/admin/ScrumBoard.tsx`:**
- 3 kolumny: TODO, IN_PROGRESS, DONE
- Drag & Drop (react-beautiful-dnd lub podobne)
- Update status → PATCH /api/scrum-tasks/[id]

**Schema - BusinessGoal:**
```prisma
model BusinessGoal {
  id            Int      @id @default(autoincrement())
  title         String
  description   String?
  target_value  Float    // Np. 50000 dla "50k revenue"
  current_value Float    @default(0)
  unit          String   @default("PLN")  // PLN, clients, bookings
  deadline      DateTime?
  status        String   @default("ACTIVE")  // ACTIVE, COMPLETED, FAILED
  created_at    DateTime @default(now())
}
```

**Schema - ScrumTask:**
```prisma
model ScrumTask {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("TODO")  // TODO, IN_PROGRESS, DONE
  priority    String   @default("MEDIUM")  // LOW, MEDIUM, HIGH
  assigned_to Int?     // AdminUser ID
  due_date    DateTime?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

**Przepływ Danych BI Dashboard:**
```
1. USER otwiera /admin/analytics
   ↓
2. useEffect → fetch('/api/analytics/summary')
   ↓
3. API agreguje dane:
   - SELECT SUM(price) FROM bookings
   - SELECT COUNT(*) FROM gift_cards WHERE status='active'
   - SELECT * FROM business_goals WHERE status='ACTIVE'
   ↓
4. Zwraca JSON z summary + chartData + goals
   ↓
5. Frontend renderuje:
   - StatCards (4 metryki)
   - AnalyticsCharts (wykresy Recharts)
   - Goals progress bars
   - ScrumBoard (Kanban)
```

**AI Suggestions (Przyszłościowa Funkcja):**
- Analizuje niskie bookings → Sugeruje promo email
- Wykrywa trend spadkowy → Alertuje
- Porównuje z celami → Recommendations
- Obecnie: Placeholder - nie zaimplementowane

**⚠️ Missing Component: Visitor Counter/Google Analytics-like**

User wspomina że przed BI Dashboard była strona **"licznik odwiedzin"** (visitor tracking).  
**Status:** Nie ma jej w obecnym kodzie - została zastąpiona przez BI Dashboard.

**Co było (przypuszczalnie):**
- Tabela `AnalyticsEvent` do trackingu
- Frontend z wykresem odwiedzin (PAGE_VIEW events)
- Unique visitors, page views, bounce rate
- Podobne do Google Analytics

**Zalecenie:** 
Dodać zakładki w `/admin/analytics`:
- Tab 1: "Odwiedziny" (visitor tracking)
- Tab 2: "BI Dashboard" (obecna implementacja)

---

## 🗄️ BAZA DANYCH

**Tabele:**
- `Booking` - Rezerwacje sesji
- `ServiceType` - Typy usług (Ślub, Portret, etc.)
- `Package` - Pakiety cenowe dla każdej usługi

**Relacje:**
```
ServiceType (1) ─── (N) Package
                        │
                        └── (N) Booking (przez nazwę)
```

**Schema - ServiceType:**
```prisma
model ServiceType {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  icon        String?
  description String?
  order       Int       @default(0)
  is_active   Boolean   @default(true)
  packages    Package[]
}
```

**Schema - Package:**
```prisma
model Package {
  id                Int         @id @default(autoincrement())
  service_id        Int
  name              String
  description       String?
  hours             Int         // Długość sesji
  price             Int         // Cena w groszach (PLN)
  features          String?     // JSON lista features
  available_hours   String?     // JSON dostępne godziny
  blocks_entire_day Boolean?    // Czy blokuje cały dzień
  service           ServiceType @relation(...)
}
```

**Schema - Booking:**
```prisma
model Booking {
  id                Int      @id @default(autoincrement())
  service           String   // Nazwa usługi
  package           String   // Nazwa pakietu
  price             Int
  date              DateTime
  start_time        String?
  client_name       String
  email             String
  phone             String?
  venue_city        String?       // Miasto
  venue_place       String?       // Miejsce (np. nazwa sali)
  notes             String?
  promo_code        String?
  gift_card_code    String?
  status            String   @default("pending")  // pending, confirmed, cancelled
  stripe_session_id String?  // Płatność Stripe
  created_at        DateTime @default(now())
}
```

**Przepływ Rezerwacji:**
```
1. Klient wybiera usługę + pakiet na /rezerwacja
2. Wybiera datę z kalendarza
3. Opcjonalnie: Płatność online (Stripe)
4. POST /api/bookings
5. Email potwierdzający → Klient
6. Email notyfikacyjny → Admin
7. Admin zatwierdza/odrzuca w /admin/rezerwacja
```

**Blocked Dates:**
- Rezerwacje blokują kalendarz
- `blocks_entire_day = true` → Cały dzień niedostępny
- W innym przypadku: Blokuj tylko wybrane godziny

### 7. Gift Card System (Pełny Opis)

**Tabele:**
- `GiftCard` - Generowane karty podarunkowe
- `GiftCardOrder` - Zamówienia kart

**Relacje:**
```
GiftCardOrder (1) ─── (1) GiftCard
```

**Schema - GiftCard:**
```prisma
model GiftCard {
  id                Int       @id @default(autoincrement())
  code              String    @unique       // Np. GIFT-ABCD-1234
  value             Int                     // Wartość w groszach
  currency          String    @default("PLN")
  sender_name       String
  recipient_name    String
  recipient_email   String
  message           String?                 // Wiadomość od nadawcy
  theme             String    @default("christmas")
  status            String    @default("active")  // active, used, expired
  used_at           DateTime?
  used_in_booking   Int?                    // ID rezerwacji gdzie użyto
  expires_at        DateTime?
  created_at        DateTime  @default(now())
}
```

**Schema - GiftCardOrder:**
```prisma
model GiftCardOrder {
  id                Int       @id @default(autoincrement())
  order_number      String?   @unique
  customer_name     String
  customer_email    String
  amount_paid       Int
  payment_status    String    @default("pending")
  payment_method    String?   // stripe, payu
  stripe_session_id String?
  card_id           Int
  created_at        DateTime  @default(now())
  paid_at           DateTime?
  gift_card         GiftCard? @relation(...)
}
```

**Przepływ Zakupu:**
```
1. Klient wypełnia formularz na /karta-podarunkowa
2. Wybiera wartość (100, 200, 500 PLN)
3. Wybiera motyw (Christmas, Valentine, Birthday, etc.)
4. POST /api/gift-cards/create
5. Redirect do płatności (Stripe/PayU)
6. Webhook po płatności:
   - Tworzy GiftCard
   - Generuje unikalny kod
   - Wysyła email do odbiorcy
7. Email zawiera:
   - Wizualizację karty (GiftCard.tsx)
   - Kod promocyjny
   - Link do realizacji
```

**Motywy Kart:**
- `christmas` - Boże Narodzenie (🎄)
- `wosp` - Wielka Orkiestra (❤️)
- `valentines` - Walentynki (💝)
- `easter` - Wielkanoc (🐰)
- `wedding` - Ślub (💒)
- `birthday` - Urodziny (🎂)

### 8. Blog CMS

**Tabele:**
- `BlogPost` - Wpisy blogowe
- `BlogCategory` - Kategorie wpisów

**Schema - BlogPost:**
```prisma
model BlogPost {
  id               Int           @id @default(autoincrement())
  title            String
  slug             String        @unique
  excerpt          String?
  content          String        // HTML/Markdown
  featured_image   Int?          // MediaLibrary ID
  author_id        Int
  category_id      Int?
  tags             String?       // Comma-separated
  meta_title       String?
  meta_description String?
  is_published     Boolean       @default(false)
  published_at     DateTime?
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt
  author           AdminUser     @relation(...)
  category         BlogCategory? @relation(...)
  featured_media   MediaLibrary? @relation(...)
}
```

**Funkcje:**
- Rich text editor (WYSIWYG)
- Media Library integration
- SEO fields (meta title, description)
- Categories + Tags
- Draft/Publish workflow

### 9. Analytics & AI Dashboard

**Tabele:**
- `AnalyticsEvent` - Zdarzenia śledzące
- `AnalyticsSnapshot` - Migawki dzienne
- `MarketingAction` - Akcje marketingowe

**Schema - AnalyticsEvent:**
```prisma
model AnalyticsEvent {
  id          Int      @id @default(autoincrement())
  event_type  String   // PAGE_VIEW, FORM_SUBMIT, BOOKING_START, etc.
  page_url    String?
  user_agent  String?
  ip_address  String?
  metadata    String?  // JSON z dodatkowymi danymi
  created_at  DateTime @default(now())
}
```

**Schema - AnalyticsSnapshot:**
```prisma
model AnalyticsSnapshot {
  id              Int      @id @default(autoincrement())
  snapshot_date   DateTime @default(now())
  total_revenue   Float
  bookings_count  Int
  conversion_rate Float?
  metadata        String?  // JSON z dodatkowymi metrykami
  created_at      DateTime @default(now())
}
```

**AI Suggestions:**
- Analizuje `AnalyticsEvent` + `Booking` + `GiftCardOrder`
- Generuje sugestie akcji marketingowych
- Np. "Low bookings this week → Send promo email"
- Wyświetla w `/admin/dashboard`

### 10. Media Library

**Tabela:** `MediaLibrary`

**Schema:**
```prisma
model MediaLibrary {
  id                      Int      @id @default(autoincrement())
  file_name               String
  original_name           String
  file_path               String   // S3 URL
  file_size               BigInt
  mime_type               String
  width                   Int?
  height                  Int?
  folder                  String   // portfolio, blog, hero, etc.
  category                String?
  tags                    String?
  alt_text                String?
  webp_path               String?  // Optimized formats
  avif_path               String?
  thumbnail_path          String?
  used_in                 String?  // Where is this file used
  is_featured             Boolean  @default(false)
  uploaded_by             Int?
  created_at              DateTime @default(now())
  uploader                AdminUser? @relation(...)
  
  // Relations (używane w różnych miejscach)
  portfolio_covers        PortfolioSession[]
  hero_slides             HeroSlide[]
  blog_featured           BlogPost[]
  challenge_photos        ChallengePhoto[]
}
```

**Funkcje:**
- Upload do AWS S3
- Automatyczna optymalizacja (WebP, AVIF)
- Generowanie miniatur
- Tagowanie i kategoryzacja
- Track usage (gdzie plik jest używany)

### 11. Settings System

**Tabela:** `Setting`

**Kluczowe Ustawienia:**
```prisma
model Setting {
  id                     Int      @id @default(autoincrement())
  setting_key            String   @unique
  setting_value          String?
  
  // Logo & Branding
  logo_url               String?
  logo_dark_url          String?  // Logo dla dark mode
  logo_drone_url         String?  // Logo dla strony dron
  logo_size              Int      @default(140)
  favicon_url            String?
  
  // Navigation
  navbar_layout          String?  @default("logo_left_menu_right")
  navbar_sticky          Boolean  @default(true)
  navbar_transparent     Boolean  @default(false)
  navbar_font_family     String   @default("Montserrat")
  navbar_font_size       Int      @default(16)
  
  // Payments
  stripe_publishable_key String?
  stripe_secret_key      String?
  payu_client_id         String?
  payu_client_secret     String?
  payu_environment       String   @default("sandbox")
  
  // Analytics
  google_analytics_id    String?
  google_tag_manager_id  String?
  facebook_pixel_id      String?
  
  // Email
  smtp_host              String?
  smtp_port              Int?
  smtp_user              String?
  smtp_password          String?
  
  // Features
  gift_card_promo_enabled Boolean @default(false)
  urgency_enabled        Boolean  @default(false)
  urgency_slots_remaining Int?
  seasonal_effect        String?  @default("none")  // snow, petals, none
}
```

**Admin Panel:** `/admin/settings`
- Grupowane w zakładki (Logo, Płatności, Email, etc.)
- Walidacja przed zapisem
- Encrypted fields dla haseł/kluczy API

---

## � BUSINESS INTELLIGENCE & ANALYTICS SYSTEM

### Overview
Kompletny system śledzenia zachowań klientów na każdym etapie customer journey:
- **Page Views** - Która strona interesuje klientów?
- **Conversions** - Kto złożył zamówienie/rezerwację?
- **Drone Orders** - Ile zleceń dronowych?
- **Booking Flow** - Czy klienci rezerwują sesje?
- **Custom Events** - Jakiekolwiek interakcje

### Tabele Analityczne

#### 1. AnalyticsEvent (Page-Level Tracking)
```prisma
model AnalyticsEvent {
  id           Int      @id @default(autoincrement())
  event_type   String   // page_view, click, drone_order_submitted
  page_url     String?  // /dron, /rezerwacja, /portfolio
  user_id      String   // Unique visitor ID
  session_id   String   // Session identifier
  referrer     String?  // Where user came from
  metadata     String?  // JSON field for custom data
  created_at   DateTime @default(now())
}
```

#### 2. AnalyticsSnapshot (Daily Metrics)
```prisma
model AnalyticsSnapshot {
  id              Int      @id @default(autoincrement())
  snapshot_date   DateTime @default(now())
  total_revenue   Float
  bookings_count  Int
  conversion_rate Float?
  metadata        String?  // drone_orders, page_views, bounce_rate, etc
  created_at      DateTime @default(now())
}
```

#### 3. BusinessGoal (KPI Tracking)
```prisma
model BusinessGoal {
  id             Int      @id @default(autoincrement())
  title          String
  target_amount  Float
  current_amount Float
  category       String   // bookings, drone_orders, revenue, analytics
  start_date     DateTime
  end_date       DateTime
}
```

### API Endpoints for BI

- `GET /api/admin/bi/snapshots` - Historical metrics
- `POST /api/admin/bi/snapshots` - Create daily snapshot
- `GET /api/admin/bi/goals` - Business goals with progress
- `POST /api/admin/bi/goals` - Create new goal

### Admin Analytics Dashboard

**Location:** `/admin/analytics`

**Features:**
1. **Key Metrics Card** - Revenue, Bookings, Conversions, Drone Orders
2. **Analytics Charts** - Page views, conversion funnel, traffic sources
3. **Business Goals Progress** - KPI tracking with % complete
4. **Recent Events** - Last 10 conversions and orders
5. **Insights & Recommendations** - AI-suggested actions

---

## �🗄️ BAZA DANYCH

### KOMPLETNA LISTA TABEL

| Tabela | Przeznaczenie | Kluczowe Kolumny | Relacje |
|--------|---------------|------------------|---------|
| `admin_users` | Użytkownicy admina | email, password_hash, role | → blog_posts, media_library |
| `settings` | Globalne ustawienia | setting_key, setting_value | - |
| `menu_items` | Menu nawigacyjne | title, url, parent_id, order | → pages (optional), ↔ self (parent-child) |
| `media_library` | Pliki/zdjęcia | file_path, folder, mime_type | → portfolio, blog, hero |
| `pages` | Strony dynamiczne | slug, title, sections (JSON) | → menu_items |
| `bookings` | Rezerwacje sesji | service, package, date, status | - |
| `service_types` | Typy usług | name, description | → packages |
| `packages` | Pakiety cenowe | name, price, hours | → service_types |
| `gift_card_orders` | Zamówienia kart | order_number, payment_status | → gift_cards |
| `gift_cards` | Karty podarunkowe | code, value, status, theme | → gift_card_orders |
| `blog_posts` | Wpisy blogowe | title, slug, content | → blog_categories, admin_users, media_library |
| `blog_categories` | Kategorie bloga | name, slug | → blog_posts |
| `portfolio_sessions` | Sesje portfolio | title, slug, category | → gallery_photos, media_library |
| `gallery_photos` | Zdjęcia w sesji | session_id, url, order | → portfolio_sessions |
| `hero_slides` | Slajdy hero | title, image, order | → media_library |
| `testimonials` | Opinie klientów | client_name, content, rating | → media_library (photo) |
| `challenge_settings` | Ustawienia wyzwań foto | title, description | - |
| `challenge_photos` | Zgłoszenia wyzwań | participant_name, photo | → media_library |
| `drone_orders` | Zamówienia dron | service_type, status | - |
| `analytics_events` | Zdarzenia tracking | event_type, page_url | - |
| `analytics_snapshots` | Migawki dzienne | total_revenue, bookings_count | - |
| `marketing_actions` | Akcje marketingowe | client_name, action_type | - |
| `error_notes` | Dziennik błędów | error_type, solution | - |

### Najważniejsze Tabele

#### 1. `pages`
```sql
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE,  -- URL (np. 'oferta')
  title VARCHAR(255),
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Co Przechowuje:**
- Strony dynamiczne (Oferta, Dron, O Mnie)
- Każda strona ma unikalne URL (slug)

#### 2. `page_sections`
```sql
CREATE TABLE page_sections (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id),
  type VARCHAR(50),           -- 'HERO', 'GALLERY', 'TEXT'
  content JSONB,              -- Dane sekcji (flex schema)
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Co Przechowuje:**
- Sekcje każdej strony (HERO, galeria, tekst)
- Content jako JSON = elastyczność

#### 3. `menu_items`
```sql
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255),
  href VARCHAR(255),
  order_index INTEGER,
  parent_id INTEGER REFERENCES menu_items(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Co Przechowuje:**
- Struktura menu nawigacyjnego
- Hierarchia (parent-child)

#### 4. `portfolio_sessions`
```sql
CREATE TABLE portfolio_sessions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  cover_photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `gallery_photos`
```sql
CREATE TABLE gallery_photos (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES portfolio_sessions(id),
  url TEXT,
  alt_text VARCHAR(255),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Prisma Schema

**Lokalizacja:** `prisma/schema.prisma`

**Przykład:**
```prisma
model Page {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  published   Boolean  @default(false)
  sections    PageSection[]
  created_at  DateTime @default(now())
  
  @@map("pages")
}

model PageSection {
  id         Int      @id @default(autoincrement())
  page       Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  pageId     Int
  type       String
  content    Json
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  
  @@map("page_sections")
}
```

**Kluczowe Koncepty:**
- `@relation` - Definiuje relacje między tabelami
- `onDelete: Cascade` - Usuń sekcje gdy strona jest usuwana
- `@@map("pages")` - Nazwa tabeli w DB (snake_case)

---

## 🚀 DEPLOYMENT

### Netlify Build Process

```
1. GIT PUSH
   ↓ Webhook do Netlify
   
2. NETLIFY CLONE REPO
   ↓ git clone https://github.com/user/repo
   
3. INSTALL DEPENDENCIES
   ↓ npm install
   
4. PRISMA GENERATE
   ↓ npx prisma generate    # ⚠️ Generuje klienta z schema.prisma
   
5. BUILD
   ↓ npm run build          # next build
   
6. DEPLOY
   ↓ Publikuje na wlasniewski.pl
```

### ⚠️ NIEBEZPIECZEŃSTWO: Auto DB Push

Jeśli `prisma/schema.prisma` się zmieni:

```bash
# Netlify MOŻE automatycznie uruchomić:
npx prisma db push         # ❌ NADPISUJE BAZĘ bez backupu!
```

**Dlaczego To Jest Złe:**
- `db push` synchronizuje schema z bazą
- Jeśli dodasz nową tabelę → OK
- Jeśli zmienisz/usuniesz kolumnę → **UTRATA DANYCH**

**Prawidłowa Procedura:**
```bash
# Lokalnie:
npx prisma migrate dev --name add_new_field
# To tworzy: prisma/migrations/XXX_add_new_field/migration.sql

# Commit:
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "Migration: Add new field (SAFE)"

# Deploy:
git push
# Netlify uruchomi: prisma migrate deploy (bezpieczne)
```

---

## ✅ PROCEDURY WERYFIKACJI

### Pre-Deployment Checklist

```bash
# 1. Lokalny Build
npm run build
# ✅ Exit code 0?

# 2. Backup Bazy
node scripts/backup-database.js
# ✅ Backup created in backups/?

# 3. Sprawdź Staged Files
git status
git diff --cached --name-only
# ❌ prisma/schema.prisma jest staged?
# ❌ .env jest staged?
# ❌ package.json jest staged (bez powodu)?

# 4. Commit Message
git commit -m "Clear description without schema changes"

# 5. Pre-Push Verification
git show HEAD --name-only
# ✅ Tylko pliki które zamierzałeś zmienić?

# 6. Push
git push

# 7. Monitor Netlify
# Otwórz: https://app.netlify.com/sites/your-site/deploys
# Sprawdź logi - szukaj "ERROR" lub "prisma db push"

# 8. Post-Deploy Check
curl https://wlasniewski.pl/
npx prisma studio
# ✅ Menu items count = same as before?
# ✅ Gallery photos count = same?
```

### Database Health Check

```bash
# Uruchom Prisma Studio
npx prisma studio

# Sprawdź kluczowe tabele:
# MenuItem: X rows
# GalleryPhoto: X rows
# PortfolioSession: X rows
# pages: X rows

# Zanotuj liczby PRZED deploymentem
# Porównaj PO deployment
```

### Rollback Procedure

Jeśli coś poszło nie tak:

```bash
# 1. Cofnij Git
git log --oneline -5               # Znajdź ostatni dobry commit
git reset --hard COMMIT_HASH       # Cofnij lokalnie
git push --force                   # Cofnij na serwerze

# 2. Restore Bazy (jeśli masz backup)
node scripts/restore-database.js backups/backup-YYYY-MM-DD.json

# 3. Verify
npm run build
npx prisma studio
curl https://wlasniewski.pl/
```

---

## 🔍 DEBUGGING

### Częste Problemy

#### Problem 1: "Build Failed - Module Not Found"
```
Error: Cannot find module 'X'
```

**Rozwiązanie:**
```bash
npm install                # Reinstaluj dependencies
rm -rf .next               # Wyczyść cache
npm run build              # Try again
```

#### Problem 2: "Database Connection Failed"
```
PrismaClientInitializationError: Can't reach database server
```

**Rozwiązanie:**
```bash
# Sprawdź .env
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

#### Problem 3: "Page Not Found after Deploy"
```
404 on /portfolio
```

**Możliwe Przyczyny:**
1. Brak danych w DB → Portfolio sessions puste
2. Błąd w `generateStaticParams()`
3. Routing issue w Next.js

**Debug:**
```bash
# Sprawdź DB
npx prisma studio

# Sprawdź build output
npm run build 2>&1 | grep "/portfolio"
```

---

## 📚 DODATKOWE ZASOBY

### Dla Początkujących

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **React Tutorial:** https://react.dev/learn
-** TypeScript Handbook:** https://www.typescriptlang.org/docs/

### Project-Specific Docs

- [`POST_MORTEM_2025-12-20.md`](POST_MORTEM_2025-12-20.md) - Incident analysis
- [`PROJECT_HISTORIA.md`](PROJECT_HISTORIA.md) - Change log

---

## 🎯 QUICK REFERENCE

### Najważniejsze Komendy

```bash
# Development
npm run dev                 # Start dev server
npx prisma studio          # Open database GUI

# Build & Test
npm run build              # Production build
npm run lint               # Check code quality

# Database
npx prisma migrate dev     # Create migration
npx prisma migrate deploy  # Apply migrations (production)
npx prisma db push         # ❌ DANGEROUS - Force sync schema

# Backup & Restore
node scripts/backup-database.js
node scripts/restore-database.js backups/file.json

# Git
git status
git diff --cached
git add src/specific/file.ts
git commit -m "Description"
git push
```

### Environment Variables (.env)

```bash
DATABASE_URL="postgresql://..."    # Neon DB connection
AWS_ACCESS_KEY_ID="..."           # S3 upload
AWS_SECRET_ACCESS_KEY="..."
SENDGRID_API_KEY="..."            # Email sending
NEXT_PUBLIC_SITE_URL="https://wlasniewski.pl"
```

**⚠️ NIGDY nie commituj `.env` do Git!**

---

## ✨ PODSUMOWANIE

**Kluczowe Nauki:**

1. **Separation of Concerns:**
   - Frontend (`/app`) = Co widzi użytkownik
   - API (`/api`) = Logika biznesowa
   - Database (Neon) = Trwałe dane

2. **Data Flow:**
   - User Request → Next.js → Prisma → PostgreSQL → Response

3. **Safety First:**
   - ZAWSZE backup przed deploymentem
   - NIGDY `git add .`
   - Schema changes TYLKO przez migrations

4. **Verification:**
   - Build lokalnie PRZED push
   - Sprawdź staged files
   - Monitor deployment logs
   - Verify database PO deploy

---

## Current System Status & Recovery (Dec 2025 Incident)

**Status:** 🚨 **RECOVERY MODE REQUIRED**

### System Catastrophe Summary
On 2025-12-21, a catastrophic database wipe occurred during an attempted feature deployment. The production database (Neon.tech) was reset, leading to complete data loss across all tables.

### Current Deficiencies:
- **Authentication:** Admin accounts are deleted. Manual restoration of `AdminUser` table is required to regain access to `/admin`.
- **Reservations:** The `Package` and `ServiceType` tables are empty. The public `/rezerwacja` page will not function until these are populated.
- **Drone Services:** The page `/dron` has been rolled back to a version from commit `b15dfb9`. While functional as a display page, its ability to be edited via the CMS is compromised due to missing database records.
- **Database Schema:** There is a known inconsistency in the `Setting` table (missing columns like `logo_drone_url` in the current migrated state).

### Recovery Instructions for Next Maintainer:
1.  **Regain Admin Access:** Use `npx prisma studio` to manually create an admin user or run a secure seeding script that handles BCrypt hashing correctly.
2.  **Restore Schema Consistency:** Perform a clean `prisma migrate deploy` to ensure the Neon.tech database matches the current `schema.prisma`.
3.  **Data Re-population:** Utilize the backup file `backups/backup-2025-12-21T08-35-05.json` to manually verify and re-insert missing package and pricing data.
4.  **Verification:** Test the full booking flow from service selection through to summary to ensure all relations are properly restored.

**Warning:** Do not use `prisma db push` on this project's production environment.
---

**Data Utworzenia:** 2025-12-21  
**Wersja:** 1.0  
**Autor:** Antigravity AI  
**Cel:** Edukacja + Bezpieczeństwo Deploymentów
