# EVENT MARKETPLACE SAAS MANIFESTO - wlasniewski.pl

Ten dokument definiuje strategiczną transformację platformy z autorskiej witryny w wielousługowy hub "Event Marketplace". Jest to nadrzędne źródło prawdy dla architektury i logiki biznesowej od daty: 2026-01-05.

## 1. Wizja i Cele Strategiczne
Platforma ewoluuje z autorskiej witryny fotograficznej w kompleksowy ekosystem łączący klientów z dostawcami usług takich jak fotografowie, DJ-e, zespoły muzyczne czy właściciele fotobudek.

**Główny Cel:** Stworzenie scentralizowanego miejsca rezerwacji, gdzie Admin (Właściciel) pełni rolę gwaranta jakości i głównego operatora finansowego.

**Kluczowe filary:**
- **API-First Architecture**: Przygotowanie pod natywną aplikację mobilną.
- **Centralizacja Finansowa**: Cały przepływ pieniężny przez konto Admina.
- **Jakość Premium**: Zachowanie standardu "Zero Flower" niezależnie od dostawcy.

## 2. Architektura Ról i Izolacja Uprawnień

### Administrator (Owner)
- Posiada absolutną kontrolę nad systemem (`/admin`).
- Weryfikuje profile dostawców i pakiety.
- Narzuca stawki prowizji (indywidualnie per dostawca).
- Wgląd w pełną analitykę i logi.

### Dostawca Usług (Provider)
- Korzysta z izolowanego panelu (`/provider-panel`).
- Zarządza własnym portfolio i kalendarzem dostępności.
- Edytuje pakiety (wymagają zatwierdzenia przez Admina).
- Wgrywa materiały do galerii swoich klientów.
- **Ograniczenie**: Nie widzi danych globalnych ani innych dostawców.

### Klient (Client)
- Posiada konto osobiste (Dashboard zamówień).
- Dostęp do interaktywnych galerii (Standard/Premium).
- Historia płatności i zamówień.

## 3. Holy Logic Finansowa: Prowizje i Płatności

1. **Scentralizowane Płatności (Proxy)**:
   - 100% wpłaty trafia na konto Admina (PayU/P24).
   - Dostawca nie otrzymuje wpłaty bezpośrednio od klienta.

2. **System Prowizyjny**:
   - Admin definiuje `commission_rate` (np. 15%) dla każdego dostawcy.
   - Kwota Netto dla dostawcy = `Total Order Amount` - `Commission`.

3. **Payouts & Settlement**:
   - Środki dla dostawcy są księgowane w tabeli `Payouts` jako "Oczekujące".
   - Zwolnienie środków (Payout Release) następuje manualnie lub automatycznie po pomyślnym zakończeniu zlecenia (brak reklamacji).

## 4. Multikalendarz i Bundle Engine

1. **Niezależna Dostępność**:
   - Każdy Dostawca ma własny kalendarz (`ProviderAvailability`).
   - System sprawdza kolizje per dostawca.

2. **Inteligentne Łączenie (Cross-Service Booking)**:
   - Koszyk obsługuje wielu wykonawców jednocześnie (np. Fotograf + DJ).
   - Algorytm "Intersection" znajduje wspólne wolne terminy dla wszystkich wybranych usługodawców.

3. **Silnik Rabatowy (Dynamic Bundles)**:
   - Reguły: "Przy zakupie Fotografa i DJ-a -> -10% na całość".
   - Ceny aktualizują się w czasie rzeczywistym.

## 5. Nowy Flow: Karty Podarunkowej i Konta

1. **Personalizacja**:
   - Zakup karty wymaga podania danych obdarowanego (Imię, Email, Wiadomość).
   - Automatyczna wysyłka estetycznego vouchera (PDF) po wpłacie.

2. **Account-First Strategy**:
   - Zakup "Jako Gość" = tylko pliki mailem (brak galerii online).
   - Założenie Konta = dostęp do Galerii Premium, wyboru ujęć i historii.

3. **Zintegrowana Galeria (Unified Model)**:
   - Galeria jest częścią obiektu `Booking` lub `GiftCard`.
   - Podział na asser: `Standard` (w pakiecie) i `Premium` (płatne).
   - Zdjęcia dodaje przypisany Dostawca lub Admin.

## 6. Protokoły Bezpieczeństwa (Zero Loss & Zero Flower)

1. **Zasada Zero Loss**:
   - Dodanie nowego typu usługi/dostawcy wymaga pełnego backupu 40 tabel (`npm run db:backup`).
   - Zakaz używania `prisma db push` na produkcji. Tylko `migrate`.

2. **Zero Flower Strategy**:
   - System wstrzykuje dynamiczne "Placeholdery Premium", jeśli dostawca nie uzupełnił portfolio/opisu.
   - Frontend nigdy nie wyświetla pustych sekcji ("Lorem ipsum" czy pustych gridów).

3. **Host Integrity**:
   - Backup zawsze odzwierciedla stan hostingu. Lokalne wersje nie są źródłem prawdy.

## 7. Local Integration Environment (Localhost = Safe Haven)
1. **Local First**:
   - Wszystkie zmiany w schemacie (Schema) i nowe funkcje (Newsletter) są najpierw wdrażane i testowane na lokalnej bazie PostgreSQL.
   - Dopiero po akceptacji (User Approval) schema jest wypychana na Produkcję (Neon).
2. **Zero Risk**:
   - Praca na localhost gwarantuje, że błędy deweloperskie nie wpłyną na żywy system ani limity cloudowe.

## 8. Skalowalność (Future Proof)
- Modularna budowa pozwala na dodawanie kategorii (np. Barman) bez zmiany kodu (konfiguracja w DB).
- API przygotowane pod mobile app (REST/JSON).

## 9. Plan Wykonania i Testów (Provider Oversight) - 2026-01-06

### Wykonanie (Execution)
1. **Schema Update**:
   - Dodanie pól `client_rating` (Int) i `client_review` (String) do modelu `Booking`.
   - Pola te przechowują opinię klienta o konkretnym zleceniu.

2. **Admin Panel Update**:
   - **Widok Szczegółów (`/admin/providers/[id]`)**:
     - Dodanie przycisku "Zresetuj Hasło" (Generuje nowe hasło i wysyła mailem lub wyświetla adminowi).
     - Sekcja "Opinie Klientów": Lista recenzji zaciągnięta z tabeli `Bookings`.
     - Tabela Zleceń: Nowe kolumny "Ocena" i "Opinia".

3. **Backend Logic**:
   - Endpoint `GET /api/admin/providers/[id]`: Include `assigned_bookings` z polami review.
   - Endpoint `POST /api/admin/providers/[id]/manage`: Obsługa akcji `RESET_PASSWORD`.

### Plan Testów (Verification)
1. **Test Resetu Hasła**:
   - Admin klika "Zresetuj Hasło".
   - System prosi o potwierdzenie.
   - Nowe hasło jest wyświetlane (Toast/Modal).
   - Próba logowania `fotograf@wlasniewski.pl` nowym hasłem -> SUKCES.

2. **Test Opinii**:
   - Manualne dodanie opinii w bazie (Prisma Studio) do istniejącego zlecenia.
   - Weryfikacja czy opinia pojawia się w panelu admina na profilu dostawcy.
   - Sprawdzenie średniej oceny (jeśli wdrożona automatyzacja).

3. **Test Zmiany Prowizji**:
   - Zmiana prowizji na 20%.
   - Sprawdzenie czy nowa wartość zapisała się w profilu.
