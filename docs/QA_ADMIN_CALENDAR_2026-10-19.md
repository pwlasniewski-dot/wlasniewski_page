# Kalendarz administratora — weryfikacja 19.10.2026

Zmiana rozwija istniejący kalendarz i model Booking: formularz ręcznej rezerwacji na pulpicie i stronie kalendarza. Pulpit pokazuje miesiąc przed statystykami, z pobieraniem danych przy zmianie miesiąca lub zapisie. Rezerwacja ma jawnie podaną cenę, status `confirmed` i źródło `admin_calendar`; zapis nie wykonuje płatności, wysyłki wiadomości ani oznaczenia wpłaty. Wymagane są dane klienta, usługa, data i godziny tego samego dnia. Widoki zachowują status i kwotę zaliczki.

## Wyniki testów

- `node tests/qa/admin-calendar.cjs` — PASS. Rzeczywiste GET/POST ze stubami auth i przechowywania: odmowa dostępu przed zapisem; nieprawidłowa data, godziny, cena/typ, zbyt długi e-mail; zapis i ponowny odczyt; identyczne i kolidujące zgłoszenie zwraca 409; sąsiadujące godziny są dozwolone. Test kontroluje użycie blokady transakcyjnej zgodnej z checkout i brak oznaczenia wpłaty.
- `node --import tsx --test tests/unit/admin-calendar-ui.test.ts` — PASS. Rzeczywisty komponent React `AddCalendarBooking` renderowany w jsdom: otwarcie formularza, uzupełnienie danych, POST z tokenem i liczbową ceną, odpowiedź 201 zamyka formularz, pokazuje sukces i wywołuje odświeżenie. Odpowiedź 409 wyświetla komunikat, zachowuje dane i nie wywołuje odświeżenia. Zastąpiono granicę fetch; MessageChannel zapewnia adapter środowiska testowego React.

Testy nie zapisują danych produkcyjnych. Nie zastępują testu wdrożonego panelu z rzeczywistym administratorem i bazą. Walidacja TypeScript oraz niezależny odbiór całego zestawu zmian są raportowane oddzielnie.

## Uzupełnienie: wszystkie najbliższe rezerwacje pod kalendarzem

Mapa istniejącego procesu: `src/app/admin/dashboard/page.tsx` → `src/components/admin/DashboardCalendarWidget.tsx` → `GET /api/admin/calendar-events` (`src/app/api/admin/calendar-events/route.ts`) → istniejące Booking, Offer, PhotoChallenge, Contract i Workshop → ujednolicone statusy/zaliczki oraz `detail_url` → istniejące szczegóły w adminie. Zmiana jest odczytem tego procesu, nie zmienia płatności, kont klienta, powiadomień ani zapisanych danych.

Widget współdzieli jedno pobranie między siatką miesiąca a listą: dolna granica to wcześniejszy z początku siatki i dzisiejszego dnia w Warszawie, bez górnej granicy. Pod kalendarzem pokazuje wszystkie aktywne terminy od dziś, także z 2028 i później, według daty/godziny, niezależnie od wybranego miesiąca. Wyklucza statusy cancelled/rejected/archived/payment_failed/completed. Reużywa `BookingRow` z rokiem w dacie, klientem, godziną, usługą, miejscem i zaliczką. Nie dodano endpointu, tabeli, pollingu ani drugiego pobrania. Istniejący zapis terminu odświeża obie prezentacje.

- `node --import tsx --test tests/unit/dashboard-upcoming.test.ts tests/unit/admin-calendar-ui.test.ts` — PASS (2 testy). React/jsdom z atrapami frameworka i fetch: 13 przyszłych wpisów z pięciu źródeł, najbliższy w 2028, brak limitu liczby, kolejność dat/godzin, brak dawnych/anulowanych/zakończonych, polski rok w dacie, zachowanie listy przy zmianie miesiąca, dzień Warszawy przy UTC 22:30, przejście do szczegółów, wspólne odświeżenie po zapisie, błąd/retry i pusty wynik. Dotychczasowy rzeczywisty formularz nadal przechodzi test zapisu i konfliktu.
- Ograniczenia: testy lokalne z symulowanym API; brak testu na zalogowanej produkcji i rzeczywistego pomiaru CU-h. Lista jest celowo pełna: duża liczba przyszłych terminów zwiększa transfer/render, ale nie liczbę wywołań. Stare miesiące wymagają pobrania szerszego przedziału. Nie zmieniono istniejącego scalania źródeł ani zachowania API przy niedostępności opcjonalnego źródła.
