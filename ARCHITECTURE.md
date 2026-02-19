# ARCHITEKTURA SYSTEMU - wlasniewski.pl

Ten dokument stanowi techniczny blueprint platformy fotograficznej wlasniewski.pl. Jest on przeznaczony dla senior deweloperów i architektów systemowych, opisując strukturę, wzorce projektowe oraz krytyczne protokoły bezpieczeństwa.

---

## 1. System Overview & Tech Stack

Platforma jest nowoczesną aplikacją webową zbudowaną w architekturze **Serverless First**, kładącą nacisk na wydajność (Core Web Vitals) oraz stabilność danych.

### 1.1. Core Stack
*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) - wykorzystanie Server Components (RSC) dla optymalizacji LCP.
*   **Język**: TypeScript (Strict Mode) - gwarancja bezpieczeństwa typów w całym przepływie danych.
*   **Baza Danych**: PostgreSQL (Neon.tech) - relacyjna baza danych z obsługą Serverless Driver.
*   **ORM**: Prisma - warstwa abstrakcji danych z silnym typowaniem modeli.
*   **Storage**: AWS S3 - magazyn binarny dla mediów wysokiej rozdzielczości.
*   **UI/UX**: Tailwind CSS + Framer Motion - system mikro-animacji i responsywnego stylowania.
*   **Płatności**: Integracja REST API z Przelewy24 oraz PayU (obsługa webhooków).

---

## 2. Architektura Wysokiego Poziomu (High-Level Design)

```mermaid
graph TD
    User((Klient)) -- HTTP/S --> FE[Frontend: Next.js App Router]
    FE -- Server Components --> DB[(PostgreSQL: Neon.tech)]
    FE -- API Routes --> DB
    FE -- Authentication --> JWT[JWT / LocalStorage]
    FE -- Storage Access --> S3[AWS S3 Cloud Storage]
    
    subgraph "External Services"
        P24[Przelewy24]
        PayU[PayU Gateway]
        SMTP[Mail Server: wlasniewski.pl]
    end
    
    FE -- Payments --> P24
    FE -- Payments --> PayU

    FE -- Notifications --> SMTP
```

### 2.1. Client Portal Architecture (v3.0 Add-on)
Architektura serwisu zostanie rozszerzona o bezpieczny portal klienta:
- **Route**: `/strefa-klienta/*`
- **Auth**: Niezależny system logowania dla klientów (User Role: `CLIENT`).
- **Data Access**: Klient ma dostęp wyłącznie do rekordów (`Offer`, `Contract`, `Booking`, `ClientGallery`) powiązanych z jego `UserId`.
- **Interakcja**: Portal wykorzystuje Server Actions do bezpiecznej komunikacji z API (akceptacja ofert, negocjacje).

---

## 3. Kluczowe Wzorce i Protokoły (The "Holy" Principles)

Projekt opiera się na trzech autorskich protokołach gwarantujących niezawodność systemu.

### 3.1. Protokół "Zero Flower" (Dynamic Fallback Strategy)
Każda podstrona zarządzana przez CMS (tabela `Page`) musi posiadać mechanizm fallbacku. Jeśli rekord w bazie danych zostanie usunięty lub nie zawiera sekcji, `PageRenderer` wstrzykuje statyczną treść awaryjną („Anti-Flower”), zapobiegając renderowaniu pustych stron. Przykładem dynamicznej kontroli UI jest sekcja **Info Band**, gdzie linki "Szczegóły operacyjne" renderowane są warunkowo (tylko gdy zdefiniowano URL).

### 3.2. "Holy Logic" (Business Integrity)
Zbiór reguł krytycznych dla operacji biznesowych:
*   **Płatności**: Żaden status rezerwacji/zamówienia nie może zostać zmieniony na `confirmed` przed otrzymaniem poprawnego podpisu Webhooka z bramki płatniczej.
*   **Security**: Wszystkie trasy `/admin/*` są chronione przez autorski Middleware sprawdzający `admin_token` z `localStorage` oraz nagłówki `Authorization`.

### 3.3. Protokół "Zero Loss" (Data Persistence & Versioning) [UPDATE: 2025-12-30]
Wdrożono zaawansowany system kopii zapasowych oparty na dwóch skryptach:
- **`scripts/backup-full.ts`**: Eksportuje stan wszystkich 40 tabel bazy danych (Modele Prisma) do sformatowanych plików JSON. Backupy są kategoryzowane czasowo (`backups/[TIMESTAMP]/`), co pozwala na atomowe przywracanie konkretnych punktów w czasie.
- **`scripts/restore-full.ts`**: Skrypt przywracający, realizujący logikę **TRUNCATE CASCADE** (czyszczenie) oraz **UPSERT** (bezpieczne wstrzykiwanie danych).
- **Zasada "File vs Folder"**: Backupem jest wyłącznie plik JSON. Kopiowanie folderów jest zabronione.
- **Holy File**: Referencyjny backup "Holy Backup" znajduje się zawsze w `backups/data/[TIMESTAMP]_HOLY_BACKUP`.
- **Cel**: Ochrona „świętej treści” (Blog, Portfolio, Ustawienia, B2B) przed destrukcyjnymi operacjami schematu lub awariami dostawcy bazy danych. Służy również jako mechanizm bezpiecznego deployu ("Backup-Before-Push").

### 3.5. Protokół "GDPR Safe Harbor" (Soft Anonymization) [NEW: 2026-01-11]
W odpowiedzi na wymogi RODO (prawo do bycia zapomnianym) przy jednoczesnym zachowaniu wymogów księgowych, wdrożono hybrydowy system usuwania danych.
- **Problem**: Tradycyjne `DELETE FROM users` narusza integralność relacyjną zamówień (Gift Cards) i historii rezerwacji, uniemożliwiając raportowanie przychodów.
- **Rozwiązanie**: Funkcja `anonymizeClient` w API wykonuje "Soft Delete":
    1. Pola PII (`name`, `email`, `phone`, `recipient_name`, `sender_name`, `message`) są nadpisywane pseudonimami (np. `REMOVED-GDPR`).
    2. Identyfikator `email` (Unique) zmieniany jest na losowy hash (np. `deleted-uuid@deleted.local`) aby zwolnić adres dla nowej rejestracji.
    3. Konto otrzymuje flagę `is_active: false`.
    4. Rekordy w tabelach finansowych (`GiftCardOrder`, `Booking`) pozostają, ale bez danych osobowych.

### 3.4. "Scope Isolation" (Atomic Integrity) [NEW: 2025-12-25]
Zasada nienaruszalności modułów niezwiązanych z bieżącym zadaniem. Agent/Deweloper ma obowiązek wykonywania zmian **wyłącznie** w zakresie wskazanym przez USERA. 
*   **Zakaz Rewritu**: Zabrania się przesyłania całych plików tam, gdzie zmiana dotyczy tylko konkretnej sekcji.
*   **Zakaz Ingerencji Po Buildzie**: Absolutny zakaz modyfikacji danych produkcyjnych lub konfiguracyjnych wykraczających poza zlecony zakres operacji.
*   **Verification First**: Każda zmiana w krytycznych plikach (np. `settings/page.tsx`) musi być poprzedzona analizą `view_file`.
# ARCHITEKTURA SYSTEMU - wlasniewski.pl

Ten dokument stanowi techniczny blueprint platformy fotograficznej wlasniewski.pl. Jest on przeznaczony dla senior deweloperów i architektów systemowych, opisując strukturę, wzorce projektowe oraz krytyczne protokoły bezpieczeństwa.

---

## 1. System Overview & Tech Stack

Platforma jest nowoczesną aplikacją webową zbudowaną w architekturze **Serverless First**, kładącą nacisk na wydajność (Core Web Vitals) oraz stabilność danych.

### 1.1. Core Stack
*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) - wykorzystanie Server Components (RSC) dla optymalizacji LCP.
*   **Język**: TypeScript (Strict Mode) - gwarancja bezpieczeństwa typów w całym przepływie danych.
*   **Baza Danych**: PostgreSQL (Neon.tech) - relacyjna baza danych z obsługą Serverless Driver.
*   **ORM**: Prisma - warstwa abstrakcji danych z silnym typowaniem modeli.
*   **Storage**: AWS S3 - magazyn binarny dla mediów wysokiej rozdzielczości.
*   **UI/UX**: Tailwind CSS + Framer Motion - system mikro-animacji i responsywnego stylowania.
*   **Płatności**: Integracja REST API z Przelewy24 oraz PayU (obsługa webhooków).

---

## 2. Architektura Wysokiego Poziomu (High-Level Design)

```mermaid
graph TD
    User((Klient)) -- HTTP/S --> FE[Frontend: Next.js App Router]
    FE -- Server Components --> DB[(PostgreSQL: Neon.tech)]
    FE -- API Routes --> DB
    FE -- Authentication --> JWT[JWT / LocalStorage]
    FE -- Storage Access --> S3[AWS S3 Cloud Storage]
    
    subgraph "External Services"
        P24[Przelewy24]
        PayU[PayU Gateway]
        SMTP[Mail Server: wlasniewski.pl]
    end
    
    FE -- Payments --> P24
    FE -- Payments --> PayU

    FE -- Notifications --> SMTP
```

### 2.1. Client Portal Architecture (v3.0 Add-on)
Architektura serwisu zostanie rozszerzona o bezpieczny portal klienta:
- **Route**: `/strefa-klienta/*`
- **Auth**: Niezależny system logowania dla klientów (User Role: `CLIENT`).
- **Data Access**: Klient ma dostęp wyłącznie do rekordów (`Offer`, `Contract`, `Booking`, `ClientGallery`) powiązanych z jego `UserId`.
- **Interakcja**: Portal wykorzystuje Server Actions do bezpiecznej komunikacji z API (akceptacja ofert, negocjacje).

---

## 3. Kluczowe Wzorce i Protokoły (The "Holy" Principles)

Projekt opiera się na trzech autorskich protokołach gwarantujących niezawodność systemu.

### 3.1. Protokół "Zero Flower" (Dynamic Fallback Strategy)
Każda podstrona zarządzana przez CMS (tabela `Page`) musi posiadać mechanizm fallbacku. Jeśli rekord w bazie danych zostanie usunięty lub nie zawiera sekcji, `PageRenderer` wstrzykuje statyczną treść awaryjną („Anti-Flower”), zapobiegając renderowaniu pustych stron. Przykładem dynamicznej kontroli UI jest sekcja **Info Band**, gdzie linki "Szczegóły operacyjne" renderowane są warunkowo (tylko gdy zdefiniowano URL).

### 3.2. "Holy Logic" (Business Integrity)
Zbiór reguł krytycznych dla operacji biznesowych:
*   **Płatności**: Żaden status rezerwacji/zamówienia nie może zostać zmieniony na `confirmed` przed otrzymaniem poprawnego podpisu Webhooka z bramki płatniczej.
*   **Security**: Wszystkie trasy `/admin/*` są chronione przez autorski Middleware sprawdzający `admin_token` z `localStorage` oraz nagłówki `Authorization`.

### 3.3. Protokół "Zero Loss" (Data Persistence & Versioning) [UPDATE: 2025-12-30]
Wdrożono zaawansowany system kopii zapasowych oparty na dwóch skryptach:
- **`scripts/backup-full.ts`**: Eksportuje stan wszystkich 40 tabel bazy danych (Modele Prisma) do sformatowanych plików JSON. Backupy są kategoryzowane czasowo (`backups/[TIMESTAMP]/`), co pozwala na atomowe przywracanie konkretnych punktów w czasie.
- **`scripts/restore-full.ts`**: Skrypt przywracający, realizujący logikę **TRUNCATE CASCADE** (czyszczenie) oraz **UPSERT** (bezpieczne wstrzykiwanie danych).
- **Zasada "File vs Folder"**: Backupem jest wyłącznie plik JSON. Kopiowanie folderów jest zabronione.
- **Holy File**: Referencyjny backup "Holy Backup" znajduje się zawsze w `backups/data/[TIMESTAMP]_HOLY_BACKUP`.
- **Cel**: Ochrona „świętej treści” (Blog, Portfolio, Ustawienia, B2B) przed destrukcyjnymi operacjami schematu lub awariami dostawcy bazy danych. Służy również jako mechanizm bezpiecznego deployu ("Backup-Before-Push").

### 3.5. Protokół "GDPR Safe Harbor" (Soft Anonymization) [NEW: 2026-01-11]
W odpowiedzi na wymogi RODO (prawo do bycia zapomnianym) przy jednoczesnym zachowaniu wymogów księgowych, wdrożono hybrydowy system usuwania danych.
- **Problem**: Tradycyjne `DELETE FROM users` narusza integralność relacyjną zamówień (Gift Cards) i historii rezerwacji, uniemożliwiając raportowanie przychodów.
- **Rozwiązanie**: Funkcja `anonymizeClient` w API wykonuje "Soft Delete":
    1. Pola PII (`name`, `email`, `phone`, `recipient_name`, `sender_name`, `message`) są nadpisywane pseudonimami (np. `REMOVED-GDPR`).
    2. Identyfikator `email` (Unique) zmieniany jest na losowy hash (np. `deleted-uuid@deleted.local`) aby zwolnić adres dla nowej rejestracji.
    3. Konto otrzymuje flagę `is_active: false`.
    4. Rekordy w tabelach finansowych (`GiftCardOrder`, `Booking`) pozostają, ale bez danych osobowych.

### 3.4. "Scope Isolation" (Atomic Integrity) [NEW: 2025-12-25]
Zasada nienaruszalności modułów niezwiązanych z bieżącym zadaniem. Agent/Deweloper ma obowiązek wykonywania zmian **wyłącznie** w zakresie wskazanym przez USERA. 
*   **Zakaz Rewritu**: Zabrania się przesyłania całych plików tam, gdzie zmiana dotyczy tylko konkretnej sekcji.
*   **Zakaz Ingerencji Po Buildzie**: Absolutny zakaz modyfikacji danych produkcyjnych lub konfiguracyjnych wykraczających poza zlecony zakres operacji.
*   **Verification First**: Każda zmiana w krytycznych plikach (np. `settings/page.tsx`) musi być poprzedzona analizą `view_file`.

---

## 4. Przepływ Danych (Data Flow Diagrams)


### 4.2. Offer & Contract Flow (Client Portal) [IMPLEMENTED: 2026-02-19]
Logika biznesowa dokumentów została ujednolicona w ramach v3.0:
- **Standalone Contracts**: Model `Contract` pozwala na tworzenie dokumentów niezależnych od ofert (`offer_id` is Optional).
- **Mandatory Signature Logic**: System weryfikuje obecność `signature` administratora przed commitowaniem zmian do bazy.
- **GET /api/client/portal/contracts/[id]**: Pobiera umowę klienta z weryfikacją własności (client_id lub client_email).
- **POST /api/client/portal/contracts/[id]/sign**: Podpisuje umowę (status=signed, signed_at=now), wysyła email do admina i klienta.
- **PATCH /api/client/portal/offers/[id]**: Akceptacja/odrzucenie oferty + notyfikacja email do admina.
- **CRM Dashboard**: Tabela z kolumnami: Typ zlecenia, Oferta, Umowa, Galeria (progress bar), Kwota, Sesja. KPI bar, sortowanie, filtrowanie.

    P->>S: Webhook: PAYMENT_SUCCESS
    S->>DB: Update Booking (status: confirmed)
    S->>S: Send Confirmation Email
```

---

## 5. Drzewo Zależności i Cykl Życia Modułów (Dependency Tree)

Poniżej przedstawiono graficzną reprezentację zależności systemowych oraz kategoryzację stosu technologicznego.

### 5.1. Graf Zależności Internal (Mermaid)
```mermaid
graph LR
    subgraph "Frontend Layer (Next.js App Router)"
        P[Pages /app] --> PR[PageRenderer]
        PR --> SC[Shared Components]
        SC --> F[Framer Motion / Tailwind]
    end

    subgraph "Logic & Domain Layer (Lib)"
        API[API Routes /api] --> AUTH[lib/auth]
        API --> PAY[lib/payu]
        API --> EM[lib/email]
        API --> ANALY[lib/analytics-tracker]
        API --> S3_LIB[lib/storage/s3]
    end

    subgraph "Data Persistence Layer"
        AUTH --> PRISMA[Prisma ORM]
        PAY --> PRISMA
        EM --> PRISMA
        ANALY --> PRISMA
        PRISMA --> DB[(Neon PostgreSQL)]
    end

    subgraph "Infrastructure"
        S3_LIB --> S3_BUCKET[AWS S3 Bucket]
        EM --> SMTP_SRV[SMTP Server]
    end
```

### 5.2. Kategoryzacja Zależności Zewnętrznych (package.json)

| Kategoria | Biblioteki | Cel |
| :--- | :--- | :--- |
| **Rdzeń** | `next`, `react`, `react-dom` | Framework i biblioteka UI. |
| **Data Engine** | `prisma`, `@prisma/client` | ORM i generowanie typów DB. |
| **Bezpieczeństwo** | `jose`, `bcryptjs` | Obsługa JWT i hashowanie haseł. |
| **Infrastruktura** | `@aws-sdk/client-s3`, `nodemailer` | Przechowywanie plików i wysyłka e-mail. |
| **E-commerce** | `stripe`, `payu.ts` (custom lib) | Obsługa płatności kartowych i przelewów. |
| **UI/UX** | `framer-motion`, `lucide-react`, `tailwind-merge`, `sonner` | Animacje, ikony, stylowanie i powiadomienia. |
| **Analityka** | `recharts`, `date-fns` | Wykresy BI i manipulacja czasem. |
| **Walidacja** | `zod`, `react-hook-form` | Schematy danych i obsługa formularzy. |

---

## 6. Model Danych (Schema Design)

System wykorzystuje znormalizowany model danych z silnymi relacjami.

| Moduł | Kluczowe Modele | Charakterystyka |
| :--- | :--- | :--- |
| **Identity** | `AdminUser` | JWT Auth, Role: ADMIN/USER. |
| **CMS** | `Page`, `MenuItem` | Hierarchiczna nawigacja, JSON Sections. |
| **E-commerce** | `Booking`, `GiftCard` | Płatności asynchroniczne, walidacja kodów, statusy blokujące kalendarz. |
| **Modules** | `HeroParallax`, `StoriesGrid`, `ChronologicalGallery`, `MagazineLayout`, `ThermalHero`, `ThermalSlider`, `FloatingButton` | Sekcje dynamiczne i interaktywne. |
| **Media** | `MediaLibrary` | Metadane S3, optymalizacja formatów. |
| **Challenges** | `PhotoChallenge`, `ChallengeSetting` | Silnik wiralowy, system negocjacji terminów, dedykowana konfiguracja (HQ, Radius). |
| **Analytics** | `AnalyticsEvent`, `Snapshot` | Śledzenie konwersji, BI Dashboard. |

---

## 7. Topologia API i Infrastruktura Runtime

Architektura oparta na **Edge-ready API Routes**, zapewniająca minimalne opóźnienia w komunikacji klient-serwer.

### 7.1. Przepływ Autoryzacji i Middleware (Twin-Engine Routing)
System wykorzystuje `middleware.ts` do inteligentnego routingu ruchu:
1. **Domain Detection**: Sprawdza nagłówek `Host`.
2. **Context Switching**:
   - Jeśli domena zawiera `b2b` lub `dron` -> Rewrite URL do `/b2b`.
   - W przeciwnym razie -> Standardowy routing (B2C).
3. **Auth Check**: Następnie weryfikuje tokeny dla ścieżek `/admin`.

```mermaid
sequenceDiagram
    participant U as User Browser
    participant M as Next.js Middleware
    participant A as Admin API
    participant D as Database

    U->>M: Request /admin/* (Header API-Key)
    M->>M: Verify admin_token
    alt Valid Token
        M->>A: Forward Request
        A->>D: CRUD Operation
        D-->>A: Data
        A-->>U: JSON Response (200 OK)
    else Invalid Token
        M-->>U: Error (401 Unauthorized)
    end
```

### 7.2. Zależności Infrastrukturalne (Platform Overlays)
- **Database Engine**: PostgreSQL 16+ na Neon.tech (z obsługą połączeń poolingowych).
- **Edge Runtime**: Netlify Functions (Node.js runtime z limitem bundla 250MB).
- **Blob Storage**: AWS S3 Cluster (region eu-north-1) z polityką Public Read dla mediów.
- **SMTP Gateway**: mail.wlasniewski.pl (obsługa TLS z flagą `rejectUnauthorized: false` dla serwerów self-signed).

### 7.3. Modular Settings API
System przechodzi na architekturę rozproszonej konfiguracji:
- **/api/settings**: Zarządza globalnymi ustawieniami (Płatności, SEO, SMTP).
- **/api/photo-challenge/settings**: Dedykowany endpoint dla modułu wyzwań (HQ, Radius, FOMO).
Zapewnia to lepszą izolację kodu i mniejsze ryzyko regresji podczas edycji panelu administratora.

---

## 8. Bezpieczeństwo i Infrastruktura

### 6.1. Deployment Pipeline
Proces wdrożenia oparty na Netlify CI/CD. Kluczowym elementem jest oddzielenie środowisk (Staging vs Production) poprzez `DATABASE_URL`.
> [!CAUTION]
> Zakaz używania `prisma db push` na produkcji. Wszystkie zmiany schematu muszą przechodzić przez `prisma migrate deploy`.

### 6.2. Optymalizacja Mediów
Wszystkie zdjęcia w portfolio przechodzą przez proces optymalizacji:
1. Upload do S3 (Original).
2. Serwowanie przez Next.js `Image` component z filtrem `WebP/AVIF`.
3. Leniwe ładowanie (Lazy Loading) dla galerii masowych.

---

### 7.4. Runtime Optimization & Caching
- **Instant Sync (ISR Bypass)**: The Settings API uses `revalidatePath('/', 'layout')` to purge the global layout cache immediately upon saving settings in the Admin Panel.
- **Dynamic Analytics**: `AnalyticsLoader` is decorated with `export const dynamic = 'force-dynamic'`, ensuring that tracking IDs are never served from stale static caches.
- **Centralized MediaPicker Pattern**: `PageBuilder.tsx` follows a centralized state pattern where a single `MediaPicker` instance manages all media selections across various section types. This eliminates memory bloat and input lag associated with multiple modal instances.

### 7.5. API Resilience & Diagnostics [NEW: 2025-12-27]
To ensure system stability, critical endpoints (`/api/pages`, `/api/settings/public`) are equipped with specialized logging:
- **Enhanced Debugging**: Automatic stack trace logging to the server console upon 500 errors.
- **CORS Hardening**: Detailed S3 CORS policy requirements are documented to prevent cross-origin resource blocking during media uploads/fetches.
- **Prisma Resiliency**: Error handling specifically for code `P2025` (Record not found) and schema-out-of-sync scenarios.

### 7.6. B2B Context Stability (Navigation Layer) [NEW: 2025-12-28]
Aby zapewnić spójność doświadczenia użytkownika na domenach współdzielonych (np. `wlasniewski.pl/b2b`), wdrożono mechanizm **Context-Aware Link Resolution**:
- **Navbar Logic**: Komponent `Navbar.tsx` wykorzystuje funkcję `resolveHref`, która dynamicznie dodaje lub usuwa prefiks `/b2b` w zależności od wykrytego kontekstu hosta i ścieżki.
- **Strict Routing**: Strony B2B (np. Dron) znajdują się wyłącznie w folderze `src/app/b2b`. Fizyczne ścieżki (jak stare `/dron`) zostały usunięte na rzecz dynamicznego routingu `/b2b/[slug]`, co eliminuje ryzyko "wycieku" treści B2C.
- **Identity Preservation**: Edytorzy administracyjni są otypowani tak, aby zachowywać pole `page_type: 'b2b'`, co zapobiega przypadkowej konwersji stron biznesowych na standardowe podczas edycji treści.
- **Rendering Purity**: System renderowania (`PageRenderer.tsx`) automatycznie parsuje osadzone w bazach danych znaczniki HTML w tytułach (np. dla efektów gradientowych w nagłówkach B2B).

---

## 8. Status Produkcyjny

System jest oceniony jako **100% Ready for Production**. Wszystkie krytyczne błędy (w tym błędy zapisu ustawień, limity rozmiaru bundli na Netlify oraz opóźnienia synchronizacji analityki) zostały wyeliminowane w grudniu 2025 r.

---

*Opracowane przez: Senior Architect Antigravity*
*Ostatnia aktualizacja: 2026-01-18*
