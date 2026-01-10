# SaaS Implementation Roadmap (Detailed)

Ten dokument śledzi postępy w transformacji platformy w Event Marketplace SaaS.
Status: **IN PROGRESS**
Update: 2026-01-05

## ✅ Phase 1: Foundation (Fundamenty)
- [x] **SaaS Manifesto**: Przyjęcie dokumentu `SAAS_MANIFESTO.md` jako źródła prawdy.
- [x] **Schema Update (Zero Loss)**:
    - [x] Tabela `Payout` (Rozliczenia).
    - [x] Tabela `ProviderAvailability` (Grafik dostawcy).
    - [x] Relacja `Package.provider_id` (Pakiety dostawców).
    - [x] Update modelu `User` (Role, Relacje).
- [x] **Provider Auth**:
    - [x] Login Page (`/provider-panel/login`).
    - [x] Middleware Protection (`/provider-panel/*`).
    - [x] Role-based Redirects.

## 🚧 Phase 2: Provider & Admin Integration (Integracja Dostawca-Admin)

### 2.1 Provider Data Visibility (Admin View)
*Cel: Admin ma pełny wgląd w konta dostawców.*
- [x] **Lista Dostawców (`/admin/providers`)**:
    - [x] Tabela wyświetlająca użytkowników z rolą `PHOTOGRAPHER` / `PROVIDER`.
    - [x] Kolumny: Nazwa, Email, Status (Aktywny/Zablokowany), Ilość Pakietów, Przychód Total.
    - [x] Akcje: Zablokuj konto, Zaloguj jako (Impersonate - opcjonalne), Edytuj Prowizję.
- [x] **Szczegóły Dostawcy (`/admin/providers/[id]`)**:
    - [x] Sekcja "Profil": Edycja BIO, Avatara, Danych firmowych w imieniu dostawcy (Read-only view done).
    - [x] Sekcja "Pakiety": Lista pakietów przypisanych do tego `provider_id`.
    - [x] Sekcja "Finanse": Historia wypłat i saldo (Placeholder).
    - [x] Sekcja "Opinie": Lista recenzji i średnia ocena (Nowe 2026-01-06).

### 2.2 Provider Package Management (Zarządzanie Ofertą)
*Cel: Dostawca tworzy, Admin akceptuje.*
- [x] **API Pakietów (`/api/provider/packages`)**: CRUD dla dostawcy (Zrobione).
- [ ] **Admin Package Oversight**:
    - [x] W widoku `/admin/rezerwacja` (Globalne Pakiety) dodanie filtra "Właściciel" (Admin vs Dostawcy).
    - [x] Oznaczanie pakietów flagą `is_verified` (tylko zweryfikowane pakiety trafiają do publicznego listingu) - *Częściowo (UI Provider Badge)*.
    - [ ] **Fix**: Walidacja formularza i obsługa błędów typowania.
    - [ ] **Fix**: Walidacja formularza i obsługa błędów typowania.
    - [ ] Dodanie pola "Dostępność" (przypisanie do kalendarza).
- [ ] **Frontend Dostawcy**:
    - [x] Lista pakietów (Zrobione).

### 2.3 Calendar & Availability (Wspólny Kalendarz)
*Cel: Unikanie konfliktów terminów.*
- [x] **Tabela `ProviderAvailability`**:
    - [x] API endpoint `/api/provider/availability` (GET zajęte terminy, POST blokada).
- [x] **Provider Calendar UI**:
    - [x] Kalendarz miesięczny w `/provider-panel/availability`.
    - [x] Kliknięcie w dzień -> "Zablokuj termin" (np. urlop).
    - [x] Automatyczne blokowanie terminów z rezerwacji (`Booking`).

### 2.4 Provider Profile & Mini-Portfolio (Wizytówka)
*Cel: Prezentacja dostawcy dla klienta końcowego.*
- [ ] **Wizytówka Dostawcy**:
    - [ ] Wykorzystanie `PhotographerProfile` (bio, avatar, specjalizacje).
    - [ ] "Mini-Portfolio" (3-5 najlepszych zdjęć) - wgranie przez edycję profilu (bez osobnego modułu Portfolio).
    - [ ] Opinie (Gwiazdki/Liczba głosów) - widoczne na wizytówce.
- [ ] **Decyzja Architektoniczna**: Pełne Portfolio (`PortfolioSession`) pozostaje wyłączną własnością Admina. Dostawcy mają tylko "Wizytówkę" przy wyborze pakietu.

### 2.5 Legacy Features Audit & Adaptation (Audyt Funkcji)
*Cel: Przystosowanie istniejących modułów do modelu SaaS.*
- [ ] **Karty Podarunkowe (`GiftCard`)**:
    - [ ] Decyzja: Czy karty są globalne (finansowane przez platformę) czy per Dostawca? (Mogą być "pieniądzem" w systemie).
    - [ ] Powiązanie użycia karty z `Booking` i `Payout` (pomniejszenie prowizji lub wypłaty).
- [ ] **Foto Wyzwanie (`PhotoChallenge`)**:
    - [ ] Przypisanie wyzwań do konkretnego organizatora (Admina lub Dostawcy).
    - [ ] Sprawdzenie kalendarza organizatora przy rezerwacji terminu wyzwania.
- [x] **Admin Calendar**:
    - [x] Admin jako "Specjalny Dostawca" - własny kalendarz dostępności w `/admin/availability` (analogicznie do providera).
    - [x] Obsługa rezerwacji "administracyjnych" (poza systemem SaaS).

## 🚧 Phase 3: Booking Logic (Logika Rezerwacji)
*Cel: Klient zamawia usługę konkretnego dostawcy.*
- [ ] **Booking Engine Update**:
    - [x] Aktualizacja `BookingsTable` o relację `provider_id`.
    - [ ] Koszyk (`CartContext`) przechowuje informację o wykonawcy przy produkcie.
- [ ] **Availability Check**:
    - [ ] Przed dodaniem do koszyka: Sprawdzenie czy `Provider` jest wolny w `BookingDate`.
    - [ ] "Cross-Check": Jeśli w koszyku są 2 usługi (DJ + Foto), sprawdź czy obaj są wolni.

## ✅ Phase 4: Financials (Finanse i Prowizje)
*Cel: Transparentne rozliczenia.*
- [x] **Model Prowizyjny**:
    - [x] Dodanie pola `base_commission` do tabeli `PhotographerProfile` (Domyślnie 15%).
    - [x] Algorytm wyliczania salda: `(Zrealizowane Zlecenia * 0.85) - Wypłacone`.
- [x] **Payouts Dashboard (/provider-panel/payouts)**:
    - [x] API: `/api/provider/payouts` (GET/POST).
    - [x] Widok Dostawcy: Saldo, Historia Wypłat, Zlecenie wypłaty.
- [ ] **Admin Payouts View**:
    - [ ] Widok Admina: Lista oczekujących wypłat -> Przycisk "Oznacz jako wysłane".

---
## 📝 Notes & Rules
1. **Zero Data Loss**: Każda migracja DB musi być addytywna.
2. **Admin Authority**: Admin ma zawsze pełny dostęp (God Mode).
3. **No Placeholders**: UI nigdy nie pokazuje pustych stanów bez wyjaśnienia/CTA.
