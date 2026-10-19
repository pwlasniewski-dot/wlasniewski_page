# Google Calendar — integracja panelu

## Proces i źródła

Pulpit (`DashboardCalendarWidget.tsx`) i istniejący kalendarz
(`src/app/admin/bookings/calendar/page.tsx`) korzystają ze wspólnego komponentu
`GoogleCalendarSync.tsx`. Nie powstał drugi rejestr rezerwacji.
`GET /api/admin/calendar-events` i synchronizacja korzystają ze wspólnego
`src/lib/calendar/events.ts`: Booking, Offer, Contract, PhotoChallenge i Workshop.
Statusy i płatności pozostają w istniejących modelach; integracja nie pobiera
płatności, nie zmienia kont klientów i nie wysyła zaproszeń ani wiadomości.

Nowe API `/api/admin/google-calendar` obsługuje status, connect/callback, sync
i disconnect. Dwie nowe tabele przechowują zaszyfrowane uprawnienie OAuth oraz
mapowanie wydarzeń wszystkich pięciu źródeł. Ogólne ustawienia nie są odpowiednim
magazynem sekretów; stare pola Google w Booking nie obejmują pozostałych źródeł.

## Zachowanie

- Jednokierunkowo: strona → główny kalendarz połączonego konta Google.
- Po połączeniu panel uruchamia pierwszą synchronizację wszystkich aktywnych
  przyszłych wpisów, bez ograniczenia roku. Wpisy bez ustalonej daty są pomijane.
- Zapis terminu oczekuje na codzienną synchronizację; przycisk pozwala wykonać ją
  ręcznie. Istniejące zadanie cleanup-booking-payment-holds wywołuje integrację
  tylko o 06:15 UTC (08:15 latem / 07:15 zimą w Polsce). Pozostałe wywołania
  sprawdzają zegar przed wejściem do usługi, bez odczytów tabel kalendarza.
  Nie zmieniono częstotliwości sprzątania płatności i nie dodano nowego harmonogramu.
- Triggery źródeł zwiększają rewizję wyłącznie przy aktywnym połączeniu. Gdy brak
  zmian, zadanie nie wczytuje wszystkich terminów ani nie wywołuje Google.
- Sesje synchronizacji mają blokadę i limit czasu/liczby zapisów; duża kolejka
  jest kontynuowana później, z widocznym stanem oczekiwania. Błąd Google nie
  unieważnia wykonanego sprzątania rezerwacji płatniczych.
- Daty i godziny stosują Europe/Warsaw. Brak godziny oznacza wydarzenie całodniowe.
  Brak prawidłowej godziny końca oznacza jawnie opisany jednominutowy znacznik
  początku, a nie domniemany czas sesji.
- Mapowanie i deterministyczne identyfikatory chronią ponowienia przed duplikacją.
  Poprzedni jednorazowy eksport można rozpoznać po dokładnym znaczniku źródła
  i adresie szczegółów. Konflikt własności zatrzymuje zmianę.
- Aktualizacje/anulowania dotyczą zarządzanych przyszłych wpisów. Archiwalne
  wpisy pozostają. Niepełny odczyt źródeł blokuje synchronizację, aby nie anulować
  wydarzeń wskutek błędu bazy. Odłączenie zachowuje kopie Google i mapowanie.
- To nie jest dwukierunkowy kalendarz ani pełna kopia zapasowa bazy. Zmiany w
  Google nie wracają na stronę; ręczne kasowanie kopii w Google nie jest
  automatycznie wykrywane, jeśli źródłowy wpis się nie zmienił.

## Uruchomienie produkcyjne

1. W Google Cloud włączyć Calendar API i utworzyć klienta OAuth typu Web application.
   Dokładny Authorized redirect URI:
   `https://wlasniewski.pl/api/admin/google-calendar/callback`.
2. Skonfigurować ekran zgody i dostęp administratora. Zakresy: `openid`, `email`,
   `https://www.googleapis.com/auth/calendar.events.owned`. Integracja prosi o
   offline access. Tryb External/Testing Google ogranicza ważność refresh tokenów
   dla tego zakresu do 7 dni; trwała integracja wymaga właściwego trybu publikacji
   i spełnienia wymagań Google.
3. W Netlify ustawić serwerowe zmienne produkcyjne:
   `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`,
   `GOOGLE_CALENDAR_TOKEN_KEY` (losowe 32 bajty jako 64 znaki hex).
   Nie używać prefiksu NEXT_PUBLIC, nie wysyłać sekretów w czacie ani repozytorium.
   Klucz szyfrujący zachować bezpiecznie; zmiana klucza wymaga ponownego połączenia.
4. Po sprawdzeniu historii migracji wykonać migrację
   `prisma/migrations/20261019200000_google_calendar_sync/migration.sql`.
   Build Netlify nie wykonuje automatycznie migracji. Nie uruchamiać całej zaległej
   historii migracji na produkcji bez porównania ze stanem schematu. Przy ręcznym
   wykonaniu użyć transakcji i uzgodnić rejestr Prisma migrations.
5. Wdrożyć kod. Zalogować się do panelu na domenie `https://wlasniewski.pl`,
   kliknąć „Połącz z Google” i zaakceptować dostęp do właściwego konta.
   OAuth rozpoczyna się wyłącznie na domenie produkcyjnej, ponieważ cookie sesji
   i callback muszą należeć do tego samego hosta.
6. Potwierdzić pierwszy zapis, ponowienie bez duplikatu, zmianę godziny,
   anulowanie oraz pracę zadania cyklicznego na kontrolowanym terminie.

Bez konfiguracji OAuth synchronizacja kończy się przed odczytem tabel integracji.
Konfigurację należy włączyć dopiero po migracji. Token jest szyfrowany AES-256-GCM;
callback wiąże state i PKCE z zalogowanym administratorem. Mutacje sprawdzają Origin.

## Weryfikacja

Testy lokalne z atrapami bazy i Google, wykonujące rzeczywisty kod:

```sh
node tests/qa/admin-calendar.cjs
node tests/qa/calendar-loader.cjs
node tests/qa/google-calendar.cjs
node --import tsx --test tests/unit/google-calendar-ui.test.ts tests/unit/dashboard-upcoming.test.ts tests/unit/admin-calendar-ui.test.ts
```

Obejmują autoryzację, state/PKCE, zapis i ponowienie, adopcję eksportu, konflikt
własności, niepełne źródła, granice dat i UI. Nie zastępują prawdziwego OAuth,
testu migracji na PostgreSQL ani odbioru wdrożonego środowiska. Na etapie
przygotowania kodu nie zastosowano migracji produkcyjnej ani nowych sekretów.
