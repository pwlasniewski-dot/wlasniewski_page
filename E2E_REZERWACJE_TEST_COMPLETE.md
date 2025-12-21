# 🔍 PEŁNY DOKUMENT TESTÓW REZERWACJI E2E
## End-to-End Test Coverage: Admin → Client → Payment → BI → Analytics

**Data**: 2025-12-21  
**Zakres testów**: Całkowity flow rezerwacji fotograficznych  
**Status**: 🟡 W TRAKCIE - NAPRAWY SCHEMY

---

## 📋 STRUKTURA TESTÓW

```
┌─────────────────────────────────────────────────────────────────┐
│  FAZA 1: ADMIN PANEL - Zarządzanie Rezerwacjami                 │
├─────────────────────────────────────────────────────────────────┤
│  1.1 Login do admina                                              │
│  1.2 Tworzenie rezerwacji ręcznie w adminie                      │
│  1.3 Edycja istniejącej rezerwacji                              │
│  1.4 Validacja pól rezerwacji                                    │
│  1.5 Usuwanie rezerwacji                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAZA 2: STRONA KLIENTA - Formularz Rezerwacji                  │
├─────────────────────────────────────────────────────────────────┤
│  2.1 Dostęp do strony /rezerwacja                               │
│  2.2 Wypełnianie formularza rezerwacji                          │
│  2.3 Validacja pól (email, telefon, data)                       │
│  2.4 Wybór pakietu i usługi                                    │
│  2.5 Dodanie uwag do rezerwacji                                │
│  2.6 Submit formularza                                         │
│  2.7 Potwierdzenie wysłania                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAZA 3: PŁATNOŚĆ - Integracja Stripe i PayU                   │
├─────────────────────────────────────────────────────────────────┤
│  3.1 Inicjalizacja sesji płatności (Stripe)                    │
│  3.2 Proces płatności kartą (test 4242 4242...)                │
│  3.3 Potwierdzenie płatności (webhook Stripe)                  │
│  3.4 Inicjalizacja PayU (alternatywa)                          │
│  3.5 Zmiana statusu rezerwacji → CONFIRMED                     │
│  3.6 Email potwierdzenia do klienta                            │
│  3.7 Zapis transakcji w bazie                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAZA 4: BAZA DANYCH - Integracja i Persistencja                │
├─────────────────────────────────────────────────────────────────┤
│  4.1 Rezerwacja zapisana w tabeli `booking`                     │
│  4.2 Powiązanie z `ServiceType`                                 │
│  4.3 Powiązanie z `Package`                                     │
│  4.4 Zapis płatności w `Payment`                                │
│  4.5 Timestamp tworzenia i modyfikacji                          │
│  4.6 Status flaga updated_at                                    │
│  4.7 Wyszukiwanie rezerwacji po ID                              │
│  4.8 Wyszukiwanie rezerwacji po emailu klienta                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAZA 5: ANALITYKA - Tracking Zdarzeń                           │
├─────────────────────────────────────────────────────────────────┤
│  5.1 Event: page_view na /rezerwacja                            │
│  5.2 Event: form_viewed                                         │
│  5.3 Event: form_started (klient zaczyna wypełniać)            │
│  5.4 Event: booking_submitted (formularz wysłany)               │
│  5.5 Event: payment_initiated (płatność zaraz)                  │
│  5.6 Event: payment_completed (płatność ok)                     │
│  5.7 Event: booking_confirmed (rezerwacja zatwierdzona)        │
│  5.8 Event: confirmation_email_sent                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAZA 6: BI DASHBORAD - Metrics i Insights                      │
├─────────────────────────────────────────────────────────────────┤
│  6.1 Snapshot: total_bookings ++                                │
│  6.2 Snapshot: total_revenue += price                           │
│  6.3 Snapshot: conversion_rate update                           │
│  6.4 Snapshot: avg_order_value update                           │
│  6.5 Goal: Ślub → progress tracking                             │
│  6.6 Goal: Revenue target → progress                            │
│  6.7 Goal: Monthly bookings → progress                          │
│  6.8 Recommendation: Staff/Equipment needs                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAZA 7: ABANDONMENT TRACKING - Gdzie Klient Ucieka?            │
├─────────────────────────────────────────────────────────────────┤
│  7.1 Klient widzi stronę /rezerwacja                            │
│  7.2 Klient klika przycisk "Rezerwuj"                           │
│  7.3 Klient zaczyna wpisywać dane                               │
│  7.4 PUNKT UCIECZKI #1: Wychodzi bez wysłania formy            │
│  7.5 Klient wysyła formularz                                    │
│  7.6 PUNKT UCIECZKI #2: Odjęcie na stronie płatności          │
│  7.7 Klient widzi cenę i rezygnuje                              │
│  7.8 PUNKT UCIECZKI #3: Błąd płatności                          │
│  7.9 Klient potwierdza płatność                                 │
│  7.10 PUNKT UCIECZKI #4: Email confirmation nie dostał        │
│  7.11 Klient widzi potwierdzenie                                │
│  7.12 Rezerwacja CONFIRMED - brak ucieczki                      │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🧪 FAZA 1: ADMIN PANEL - ZARZĄDZANIE REZERWACJAMI

## Test 1.1: Login do Admin Panel

**Precondition**: Serwer running na localhost:3000

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Przejdź na `/admin` | Otwórz http://localhost:3000/admin | Redirect do `/logowanie` | ⏳ |
| 2 | Zaloguj się | Email: `pwlasniewski@gmail.com` | Formularz logowania wyświetlony | ⏳ |
| 3 | Hasło | Wpisz: `Fotograf2025!` | Pole hasła akceptuje wpisanie | ⏳ |
| 4 | Submit | Kliknij "Zaloguj się" | Redirect do `/admin` (dashboard) | ⏳ |
| 5 | Dashboard | Sprawdź czy widać navbara | Sidebar z menu: Zlecenia Dronowe, Rezerwacje | ⏳ |
| 6 | Menu | Sprawdź czy jest link do rezerwacji | Widać w sidebar "Rezerwacje" | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 1.2: Tworzenie Rezerwacji Ręcznie w Adminie

**Precondition**: Zalogowany admin

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Przejdź do rezerwacji | Kliknij "Rezerwacje" w sidebar | Strona `/admin/rezerwacje` z tabelą | ⏳ |
| 2 | Przycisk nowa | Kliknij "+ Nowa Rezerwacja" | Formularz nowej rezerwacji | ⏳ |
| 3 | Imię klienta | Wpisz: "Anna Nowak" | Pole zaakceptowane | ⏳ |
| 4 | Email | Wpisz: "anna.nowak@example.com" | Email zwalidowany | ⏳ |
| 5 | Telefon | Wpisz: "+48 600 111 222" | Format telefonu OK | ⏳ |
| 6 | Typ usługi | Wybierz: "Sesja Portretowa" | Opcja wybrana | ⏳ |
| 7 | Data | Wybierz: "2025-01-20 15:00" | Data/czas zaakceptowane | ⏳ |
| 8 | Lokalizacja | Wpisz: "Studio Fotograficzne" | Pole zaakceptowane | ⏳ |
| 9 | Pakiet | Wybierz: "Standard - 890 PLN" | Cena wyświetlona | ⏳ |
| 10 | Notatki | Wpisz: "Potrzebne zdjęcia do CV" | Pole zaakceptowane | ⏳ |
| 11 | Submit | Kliknij "Zapisz Rezerwację" | Rezerwacja dodana do tabeli | ⏳ |
| 12 | Potwierdzenie | Sprawdź czy widać "Anna Nowak" w tabeli | Rezerwacja widoczna z datą | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 1.3: Edycja Istniejącej Rezerwacji

**Precondition**: Rezerwacja Anna Nowak jest w systemie

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Kliknij rezerwację | Kliknij na wiersz "Anna Nowak" | Otwiera modal/stronę edycji | ⏳ |
| 2 | Zmień notatkę | Zmień na: "Zdjęcia do CV + LinkedIn" | Pole zaktualizowane | ⏳ |
| 3 | Zmień datę | Zmień na: "2025-01-25 16:00" | Data zmieniona | ⏳ |
| 4 | Zmień status | Zmień z PENDING → CONFIRMED | Status zaktualizowany | ⏳ |
| 5 | Zapisz zmiany | Kliknij "Aktualizuj" | Modal zatwarty, tabela updated | ⏳ |
| 6 | Weryfikacja | Sprawdź czy zmiany są widoczne | Notatka, data, status zmienione | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 1.4: Validacja Pól Rezerwacji

**Precondition**: Formularz nowej rezerwacji otwarty

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Email pusty | Spróbuj submit bez emaila | Error: "Email jest wymagany" | ⏳ |
| 2 | Email zły | Wpisz: "nievalidemail" | Error: "Email nieprawidłowy" | ⏳ |
| 3 | Telefon zły | Wpisz: "abc123" | Error: "Telefon musi zawierać +48" | ⏳ |
| 4 | Data w przeszłości | Wybierz datę historyczną | Error: "Data nie może być w przeszłości" | ⏳ |
| 5 | Brakuje usługi | Spróbuj bez wyboru usługi | Error: "Wybierz usługę" | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 1.5: Usuwanie Rezerwacji

**Precondition**: Rezerwacja testowa w systemie (Anna Nowak)

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Kliknij rezerwację | Kliknij na "Anna Nowak" | Modal edycji | ⏳ |
| 2 | Przycisk delete | Kliknij ikonę "Usuń" | Potwierdzenie: "Czy na pewno?" | ⏳ |
| 3 | Potwierdź | Kliknij "Usuń" | Rezerwacja usunięta z tabeli | ⏳ |
| 4 | Baza danych | Sprawdź czy brak w DB | SELECT * FROM booking WHERE id=... | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

# 🌐 FAZA 2: STRONA KLIENTA - FORMULARZ REZERWACJI

## Test 2.1: Dostęp do Strony Rezerwacji

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Otwórz /rezerwacja | URL: http://localhost:3000/rezerwacja | Strona ładuje bez błędów | ⏳ |
| 2 | Page title | Sprawdź tytuł strony | "Rezerwacja | Wlasniewski Fotograf" | ⏳ |
| 3 | Formularz | Sprawdź czy widać formularz | Pola: imię, email, telefon itd | ⏳ |
| 4 | Pakiety | Sprawdź opcje | 3 pakiety: Sesja (890), Ślub (4500), Przyjęcie (3500) | ⏳ |
| 5 | CTA | Sprawdź przycisk | "Zarezerwuj sesję" widoczny i clickable | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 2.2: Wypełnianie Formularza Rezerwacji

**Precondition**: Strona /rezerwacja otwarta

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Imię | Wpisz: "Maria Kowalska" | Tekst zaakceptowany | ⏳ |
| 2 | Email | Wpisz: "maria.kowalska@example.com" | Email zaakceptowany | ⏳ |
| 3 | Telefon | Wpisz: "+48 700 123 456" | Telefon zaakceptowany | ⏳ |
| 4 | Pakiet | Wybierz: "Ślub - 4500 PLN" | Cena zmienia się na 4500 | ⏳ |
| 5 | Data | Wybierz: "2025-02-14 10:00" | Data akceptowana | ⏳ |
| 6 | Lokacja | Wpisz: "Kościół + Pałac Książęców" | Tekst zaakceptowany | ⏳ |
| 7 | Notatki | Wpisz: "Reportaż ślubny, drony mile widziane" | Tekst zaakceptowany | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 2.3: Validacja Pól Formularza Klienta

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Imię puste | Spróbuj submit | Error: "Imię jest wymagane" | ⏳ |
| 2 | Email pusty | Spróbuj submit | Error: "Email jest wymagany" | ⏳ |
| 3 | Email format | Wpisz: "zlyemail" | Error: "Email nieprawidłowy" | ⏳ |
| 4 | Telefon format | Wpisz: "123456" | Error: "Nieprawidłowy format telefonu" | ⏳ |
| 5 | Data historyczna | Wybierz przeszłość | Error: "Data musi być w przyszłości" | ⏳ |
| 6 | Notatki < 10 znaków | Wpisz: "ABC" | Error: "Min 10 znaków" (jeśli wymagane) | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 2.4: Wybór Pakietu i Usługi

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Pakiet Sesja | Kliknij "Sesja - 890 PLN" | Pakiet wybrany, cena = 890 | ⏳ |
| 2 | Pakiet Ślub | Kliknij "Ślub - 4500 PLN" | Cena zmienia się na 4500 | ⏳ |
| 3 | Pakiet Przyjęcie | Kliknij "Przyjęcie - 3500 PLN" | Cena zmienia się na 3500 | ⏳ |
| 4 | Opcjonalne dodatki | Jeśli dostępne - kliknij | Cena aktualizowana dynamicznie | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 2.5: Dodanie Uwag do Rezerwacji

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Pole notes | Kliknij w "Dodatkowe uwagi" | Focus na polu | ⏳ |
| 2 | Wpisz tekst | "Chciałbym zdjęcia w czerni, bez ludzi na tle" | Tekst zaakceptowany | ⏳ |
| 3 | Maksymalna długość | Spróbuj > 500 znaków | Tekst obcięty lub ostrzeżenie | ⏳ |
| 4 | Znaki specjalne | Wpisz: "Zdjęcia: bez @#$%" | Znaki zaakceptowane | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 2.6: Submit Formularza

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Wypełnij formularz | Wszystkie wymagane pola OK | Przycisk "Zarezerwuj" aktywny | ⏳ |
| 2 | Kliknij submit | Kliknij "Zarezerwuj sesję" | Loading spinner pojawia się | ⏳ |
| 3 | POST request | Network request wysłany | POST /api/reservations | ⏳ |
| 4 | Response 200 | Serwer zwraca ID | Status 201 Created | ⏳ |
| 5 | Rezerwacja w DB | Sprawdź bazę | Nowa rezerwacja w `booking` table | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 2.7: Potwierdzenie Wysłania

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Po submit | Czekaj 2-3 sekundy | Spinner znika | ⏳ |
| 2 | Komunikat sukcesu | Toast message | "Rezerwacja wysłana pomyślnie!" | ⏳ |
| 3 | Przełączenie | Auto-redirect | Na stronę `/rezerwacja/potwierdzenie` | ⏳ |
| 4 | Numer rezerwacji | Wyświetlony | "Twój numer rezerwacji: #12345" | ⏳ |
| 5 | Email potwierdzenia | Klient otrzyma email | Na: maria.kowalska@example.com | ⏳ |
| 6 | Zawartość emaila | Sprawdź email | ID rezerwacji, data, cena | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

# 💳 FAZA 3: PŁATNOŚĆ - INTEGRACJA STRIPE I PAYU

## Test 3.1: Inicjalizacja Sesji Płatności (Stripe)

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Po rezerwacji | Formularz wysłany | Status PENDING w bazie | ⏳ |
| 2 | Redirect płatności | Auto-redirect | Na stronę `/rezerwacja/platnosc` | ⏳ |
| 3 | Stripe session | POST /api/payment/stripe-init | Session ID zwrócony | ⏳ |
| 4 | Client secret | Sprawdź response | client_secret w JSON | ⏳ |
| 5 | Stripe form | Formularz ładuje | Stripe Elements załadowane | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 3.2: Proces Płatności Kartą (Test Card)

**Precondition**: Strona płatności Stripe załadowana

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Numer karty | Wpisz: "4242 4242 4242 4242" | Karta zaakceptowana (test) | ⏳ |
| 2 | Data ważności | Wpisz: "12/25" | Data akceptowana | ⏳ |
| 3 | CVC | Wpisz: "123" | CVC zaakceptowany | ⏳ |
| 4 | Email bilingu | Auto-fill | maria.kowalska@example.com | ⏳ |
| 5 | Przycisk Pay | Kliknij "Zapłać 4500 PLN" | Loading pojawia się | ⏳ |
| 6 | Weryfikacja 3D Secure | Jeśli wymaga | Modal z weryfikacją | ⏳ |
| 7 | Potwierdzenie | Kliknij "Potwierdź" | Płatność przetworzona | ⏳ |
| 8 | Zwrot do sklepu | Stripe redirect | Powrót na /rezerwacja/sukces | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 3.3: Potwierdzenie Płatności (Webhook Stripe)

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Event payment_intent.succeeded | Webhook wysłany | POST /api/webhooks/stripe | ⏳ |
| 2 | Webhook verification | Stripe signature check | Signature verified OK | ⏳ |
| 3 | Update status | Status → CONFIRMED | UPDATE booking SET status='CONFIRMED' | ⏳ |
| 4 | Zapisz transakcję | Payment record | INSERT INTO Payment table | ⏳ |
| 5 | Timestamp | updated_at field | Obecny czas zapisany | ⏳ |
| 6 | Email potwierdzenia | Invoice wysłany | Na email klienta | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 3.4: Inicjalizacja PayU (Alternatywa)

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Przełącznik | Kliknij "Zapłać przez PayU" | Opcja dostępna | ⏳ |
| 2 | Init order | POST /api/payment/payu-init | Order ID zwrócony | ⏳ |
| 3 | Redirect | Auto-redirect do PayU | Strona PayU załadowana | ⏳ |
| 4 | Logowanie | Wpisz dane konta PayU testowego | Login OK (lub brak konta) | ⏳ |
| 5 | Potwierdzenie | Kliknij "Zapłacić" | Płatność przetwarzana | ⏳ |
| 6 | Return | PayU callback | Powrót do aplikacji | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 3.5: Zmiana Statusu → CONFIRMED

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Po płatności | Webhook/callback otrzymany | Status zmienia się | ⏳ |
| 2 | SELECT booking | Sprawdzenie bazy | Status: 'CONFIRMED' | ⏳ |
| 3 | Payment record | Sprawdzenie Payment | Transakcja zapisana | ⏳ |
| 4 | Timestamp | updated_at | Bieżący czas | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 3.6: Email Potwierdzenia do Klienta

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Email wysłany | Po webhook'u | Email w inbox | ⏳ |
| 2 | Adres | Do: maria.kowalska@example.com | Email dotarł | ⏳ |
| 3 | Temat | Subject: "Potwierdzenie rezerwacji" | Wyświetlony prawidłowo | ⏳ |
| 4 | Zawartość | Sprawdź body | Numer rezerwacji, data, cena | ⏳ |
| 5 | HTML | Renderowanie | Logo, styling prawidłowy | ⏳ |
| 6 | CTA | Przycisk | "Przejdź do rezerwacji" linkuje | ⏳ |
| 7 | Podpis | Footer | Logo + dane fotografa | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 3.7: Zapis Transakcji w Bazie

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Payment table | SELECT * FROM Payment | Nowy rekord | ⏳ |
| 2 | Pola | Sprawdź kolumny | booking_id, amount (4500), currency (PLN) | ⏳ |
| 3 | Status | payment_status | 'PAID' lub 'SUCCEEDED' | ⏳ |
| 4 | Gateway | payment_method | 'stripe' | ⏳ |
| 5 | Transaction ID | stripe_transaction_id | Stripe ID zapisane | ⏳ |
| 6 | Timestamp | created_at, updated_at | Obecny czas | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

# 💾 FAZA 4: BAZA DANYCH - INTEGRACJA I PERSISTENCJA

## Test 4.1: Rezerwacja Zapisana w Tabeli `booking`

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Query | SELECT * FROM booking WHERE client_email='maria...' | Rekord istnieje | ⏳ |
| 2 | Pola | id, client_name, client_email, client_phone | Wszystkie wypełnione | ⏳ |
| 3 | Cena | total_price = 4500 | PLN zapisane | ⏳ |
| 4 | Status | status = 'CONFIRMED' | Zmieniony po płatności | ⏳ |
| 5 | Data | reservation_date | 2025-02-14 10:00 | Prawidłowa | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 4.2: Powiązanie z `ServiceType`

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Service ID | booking.service_id | Wskazuje na rekord ServiceType | ⏳ |
| 2 | SELECT service | FROM ServiceType WHERE id=... | Rekord "Ślub" istnieje | ⏳ |
| 3 | Name | service.name | "Ślub" | ⏳ |
| 4 | Price | service.base_price | 4500 (lub inny) | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 4.3: Powiązanie z `Package`

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Package ID | booking.package_id | Wskazuje na rekord Package | ⏳ |
| 2 | SELECT package | FROM Package WHERE id=... | Pakiet istnieje | ⏳ |
| 3 | Name | package.name | "Ślub - Pełny Reportaż" | ⏳ |
| 4 | Price | package.price | 4500 | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 4.4: Zapis Płatności w `Payment`

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 1 | Query | SELECT * FROM Payment WHERE booking_id=... | Płatność istnieje | ⏳ |
| 2 | Amount | payment.amount | 450000 (w groszach) | ⏳ |
| 3 | Currency | payment.currency | 'PLN' | ⏳ |
| 4 | Status | payment.status | 'PAID' | ⏳ |
| 5 | Gateway | payment.gateway | 'stripe' | ⏳ |
| 6 | TX ID | payment.transaction_id | Unique ID | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

## Test 4.5-4.8: Timestamps, Search, Filtering

| # | Krok | Akcja | Oczekiwany Rezultat | Status |
|---|------|-------|---------------------|--------|
| 5.1 | created_at | Booking timestamp | Chwila wysłania formularza | ⏳ |
| 5.2 | updated_at | Po płatności | Chwila potwierdzenia płatności | ⏳ |
| 5.3 | Search email | WHERE client_email=... | Szybkie znalezienie | ⏳ |
| 5.4 | Search ID | WHERE id=... | Bezpośredni dostęp | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

# 📊 FAZA 5: ANALITYKA - TRACKING ZDARZEŃ

## Event Tracking Structure

```sql
-- Każdy event zapisywany do tabeli AnalyticsEvent
INSERT INTO AnalyticsEvent (
  event_type,
  page_url,
  user_id,
  metadata,
  created_at
) VALUES (...)
```

## Test 5.1-5.8: Event Tracking

| # | Event | Moment | Warunek | Expected | Status |
|---|-------|--------|---------|----------|--------|
| 5.1 | `page_view` | Klient otwiera /rezerwacja | HTTP GET | Event zapisany | ⏳ |
| 5.2 | `form_viewed` | Formularz załadowany | DOM ready | Event zapisany | ⏳ |
| 5.3 | `form_started` | Klient klika w pole | Focus event | Event + field_name | ⏳ |
| 5.4 | `booking_submitted` | Kliknięty "Zarezerwuj" | onClick | Event + form_data (JSON) | ⏳ |
| 5.5 | `payment_initiated` | Przejście do Stripe | Redirect | Event + booking_id | ⏳ |
| 5.6 | `payment_completed` | Webhook paid | Status paid | Event + payment_id | ⏳ |
| 5.7 | `booking_confirmed` | Status = CONFIRMED | DB update | Event + amount | ⏳ |
| 5.8 | `confirmation_email_sent` | Email wysłany | Nodemailer send | Event + email | ⏳ |

**Status: ⏳ OCZEKIWANIE**

---

# 📈 FAZA 6: BI DASHBOARD - METRICS I INSIGHTS

## BI Snapshot Structure

```json
{
  "snapshot_date": "2025-12-21",
  "total_bookings": 4,
  "total_revenue": 9890,
  "conversion_rate": 0.038,
  "drone_orders_count": 5,
  "metrics": {
    "avg_order_value": 2472.50,
    "bookings_by_service": {
      "sesja": 1,
      "slub": 1,
      "przyjecie": 1,
      "inne": 1
    }
  }
}
```

## Test 6.1-6.8: BI Metrics

| # | Metric | Before | After Submit+Pay | Change | Expected |
|---|--------|--------|------------------|--------|----------|
| 6.1 | total_bookings | 3 | 4 | +1 | Increment ✓ |
| 6.2 | total_revenue | 5390 | 9890 | +4500 | Dodano cenę ✓ |
| 6.3 | conversion_rate | 0.025 | 0.038 | ↑ | Percentagically OK ✓ |
| 6.4 | avg_order_value | 1796.67 | 2472.50 | ↑ | (9890/4) ✓ |
| 6.5 | bookings_slub | 0 | 1 | +1 | Nowa kategoria ✓ |
| 6.6 | Goal: Monthly Bookings | 3/10 | 4/10 | 40% progress | Updated ✓ |
| 6.7 | Goal: Revenue 15000 | 5390/15000 | 9890/15000 | 65.9% progress | Updated ✓ |
| 6.8 | Recommendation | Staff? | "Rozważ asystenta" | Based on data | Generated ✓ |

**Status: ⏳ OCZEKIWANIE**

---

# 🚪 FAZA 7: ABANDONMENT TRACKING - GDZIE KLIENT UCIEKA?

## Abandonement Funnel Analysis

```
┌─ Krok 1: Widok strony /rezerwacja
│  └─ 100 visitors
│
├─ Krok 2: Kliknięcie "Rezerwuj"
│  └─ 45 visitors (55% drop)
│
├─ Krok 3: Rozpoczęcie formularza (focus na pole)
│  └─ 35 visitors (20% drop)
│
├─ Krok 4: PUNKT UCIECZKI #1 - Opuszczenie formy
│  └─ 5 visitors uciekło (-14%)
│  │  Akcja: Wysłanie reminder emaila
│
├─ Krok 5: Wysłanie formularza
│  └─ 30 visitors (17% drop)
│
├─ Krok 6: PUNKT UCIECZKI #2 - Opuszczenie na stronie płatności
│  └─ 3 visitors uciekło (-10%)
│  │  Akcja: Pokazanie ChatBot z pytaniem "Coś nie tak?"
│
├─ Krok 7: Widok formularza Stripe
│  └─ 27 visitors
│
├─ Krok 8: PUNKT UCIECZKI #3 - Błąd płatności
│  └─ 2 visitors (-7%)
│  │  Akcja: Wysłanie instrukcji + alt payment method
│
├─ Krok 9: Potwierdzenie płatności
│  └─ 25 visitors
│
├─ Krok 10: PUNKT UCIECZKI #4 - Email confirmation nie otrzymany
│  └─ 1 visitor (-4%)
│  │  Akcja: Resend email / SMS
│
└─ Krok 11: CONVERSION - Rezerwacja CONFIRMED
   └─ 24 visitors (24% conversion rate)
```

## Test 7.1-7.12: Abandonment Points

| # | Point | Akcja | Event | Tracking | Recovery |
|---|-------|-------|-------|----------|----------|
| 7.1 | Widok | GET /rezerwacja | `page_view` | ✓ | - |
| 7.2 | Klik CTA | Click "Rezerwuj" | `button_click` | ✓ | Push notif? |
| 7.3 | Focus form | Focus na `name` | `form_started` | ✓ | - |
| 7.4 | **UCIECZKA #1** | Zamknięcie tab/exit | `form_abandoned` | ✓ | Email: "Wróć do rezerwacji" |
| 7.5 | Submit form | POST /api/reservations | `booking_submitted` | ✓ | - |
| 7.6 | **UCIECZKA #2** | Opuszczenie /platnosc | `payment_abandoned` | ✓ | ChatBot: "Czy problem?" |
| 7.7 | Widok ceny | Wyświetlenie Stripe | `payment_viewed` | ✓ | Coupon? |
| 7.8 | **UCIECZKA #3** | Błąd karty (test decline) | `payment_failed` | ✓ | SMS: "Błąd, spróbuj PayU" |
| 7.9 | Potwierdzenie | Webhook success | `payment_completed` | ✓ | - |
| 7.10 | **UCIECZKA #4** | Email nie w inbox | `email_bounce` | ✓ | Resend + SMS |
| 7.11 | Potwierdzenie | Redirect /sukces | `page_redirect` | ✓ | - |
| 7.12 | CONVERSION | Status CONFIRMED | `booking_confirmed` | ✓ | Celebracja 🎉 |

**Status: ⏳ OCZEKIWANIE**

---

# 🧪 SCENARIUSZ TESTOWY - PEŁNY PRZEBIEG

## SCENARIO: "Magda Rezerwuje Ślub"

```
────────────────────────────────────────────────────────────────
TIMELINE: 2025-12-21 13:00 → 13:15 (15 minut)
────────────────────────────────────────────────────────────────

13:00 - Magda otwiera Instagram, widzi link do fotografa
        → Event: `external_link_click` (social)
        → Event: `page_view` /rezerwacja

13:01 - Magda czyta opis pakietów
        → Event: `page_scroll` (viewport analytics)
        → Event: `section_viewed` (pakiety)

13:02 - Magda kliknie "Zarezerwuj ślub"
        → Event: `button_click` (CTA)
        → Event: `form_viewed` (formularz loaded)

13:03 - Magda wypełnia dane
        → Event: `form_started`
        → Event: `input_change` (each field)
        → Field values: imię, email, telefon
        
13:05 - Magda wpisuje uwagi
        → Event: `textarea_input`
        → Value: "Chcemy drona do ujęć powietrznych"

13:06 - Magda kliknie "Zarezerwuj sesję"
        → Event: `form_submit` (click)
        → Event: `booking_submitted` (success)
        → Response: { booking_id: "12345", status: "PENDING" }
        → Data saved to DB: booking table

13:07 - Magda widzi "Rezerwacja wysłana!" + numer #12345
        → Event: `booking_confirmed_page_viewed`
        → Email sent: magda@example.com
        
13:08 - Magda redirectuje do /rezerwacja/potwierdzenie
        → Event: `confirmation_page_viewed`
        → Page title: "Czekamy na Twoją płatność"
        
13:09 - Magda kliknie "Przejdź do płatności"
        → Event: `payment_page_link_click`
        → Redirect: /rezerwacja/platnosc

13:10 - Magda widzi Stripe form
        → Event: `payment_form_viewed`
        → Event: `stripe_session_loaded`
        
13:11 - Magda wpisuje kartę 4242 4242...
        → Event: `payment_input_change`
        → (Card number NOT logged - PCI!)
        
13:12 - Magda kliknie "Zapłać 4500 PLN"
        → Event: `payment_submit`
        → Stripe processes: PROCESSING
        
13:13 - Stripe webhook: payment_intent.succeeded
        → Event: `payment_succeeded`
        → Webhook: POST /api/webhooks/stripe
        → Database: UPDATE booking SET status='CONFIRMED'
        → Database: INSERT Payment record
        → Email: Invoice sent to magda@example.com
        
13:14 - Magda redirectuje do /rezerwacja/sukces
        → Event: `success_page_viewed`
        → Page: "Rezerwacja potwierdzona!"
        
13:15 - Magda zamyka przeglądarkę
        → Event: `session_end`
        
────────────────────────────────────────────────────────────────
RESULTATY: ✅ CONVERSION SUCCESS
────────────────────────────────────────────────────────────────
```

## Dashboard View After Conversion:

```
📊 BI SNAPSHOT UPDATE:
├─ total_bookings: 3 → 4 (+1)
├─ total_revenue: 5390 PLN → 9890 PLN (+4500)
├─ conversion_rate: 2.5% → 3.8% (0.015 → 0.038)
├─ avg_order_value: 1796.67 → 2472.50
├─ bookings_by_service:
│  └─ slub: 0 → 1 (+1)
└─ recommendations:
   └─ "Rozważ wynajęcie drona - 5 zleceń/miesiąc"

📈 GOAL PROGRESS:
├─ Monthly Bookings: 3/10 → 4/10 (40%)
├─ Revenue Target: 5,390/15,000 → 9,890/15,000 (65.9%)
└─ Ślub Conversions: 0/2 → 1/2 (50%)

📧 COMMUNICATION SENT:
├─ Confirmation: magda@example.com ✓
├─ Invoice: magda@example.com ✓
└─ Admin notification: pwlasniewski@gmail.com ✓
```

---

# 📝 RAPORT Z WYKONANIA

## Summary Table

| Faza | Testy | Passed | Failed | % Pass | Status |
|------|-------|--------|--------|--------|--------|
| 1. Admin | 5 | 0 | 5 | 0% | ⏳ |
| 2. Klient | 7 | 0 | 7 | 0% | ⏳ |
| 3. Płatność | 7 | 0 | 7 | 0% | ⏳ |
| 4. Baza Danych | 8 | 0 | 8 | 0% | ⏳ |
| 5. Analityka | 8 | 0 | 8 | 0% | ⏳ |
| 6. BI | 8 | 0 | 8 | 0% | ⏳ |
| 7. Abandonment | 12 | 0 | 12 | 0% | ⏳ |
| **TOTAL** | **55** | **0** | **55** | **0%** | **⏳ PENDING** |

---

## Detailed Findings

### FAZA 1: Admin Panel
- Test 1.1 (Login): ⏳
- Test 1.2 (Create): ⏳
- Test 1.3 (Edit): ⏳
- Test 1.4 (Validate): ⏳
- Test 1.5 (Delete): ⏳

### FAZA 2: Client Form
- Test 2.1 (Access): ⏳
- Test 2.2 (Fill): ⏳
- Test 2.3 (Validate): ⏳
- Test 2.4 (Select): ⏳
- Test 2.5 (Notes): ⏳
- Test 2.6 (Submit): ⏳
- Test 2.7 (Confirm): ⏳

### FAZA 3: Payment
- Test 3.1 (Init Stripe): ⏳
- Test 3.2 (Process Card): ⏳
- Test 3.3 (Webhook): ⏳
- Test 3.4 (PayU): ⏳
- Test 3.5 (Status): ⏳
- Test 3.6 (Email): ⏳
- Test 3.7 (DB Save): ⏳

### FAZA 4: Database
- Test 4.1 (Booking): ⏳
- Test 4.2 (ServiceType): ⏳
- Test 4.3 (Package): ⏳
- Test 4.4 (Payment): ⏳
- Test 4.5-4.8 (Timestamps/Search): ⏳

### FAZA 5: Analytics
- Test 5.1-5.8 (Events): ⏳

### FAZA 6: BI
- Test 6.1-6.8 (Metrics): ⏳

### FAZA 7: Abandonment
- Test 7.1-7.12 (Funnel): ⏳

---

## Critical Findings

⏳ **AWAITING EXECUTION** - All 55 tests ready to run

---

## Recommendations

1. **IMMEDIATE**: Execute all 55 tests sequentially
2. **DOCUMENT**: Capture screenshots for each test
3. **LOG**: Record exact timestamps and API responses
4. **ALERT**: Flag any failures with full stack traces
5. **ITERATE**: Fix bugs and re-run failed tests

---

## Sign-Off Checklist

Before declaring "PRODUCTION READY":

```
☐ FAZA 1: All 5 admin tests = PASS
☐ FAZA 2: All 7 client form tests = PASS
☐ FAZA 3: All 7 payment tests = PASS
☐ FAZA 4: All 8 database tests = PASS
☐ FAZA 5: All 8 analytics tests = PASS
☐ FAZA 6: All 8 BI tests = PASS
☐ FAZA 7: All 12 abandonment tests = PASS
☐ CONVERSION RATE: ≥ 2% (4/200 visitors)
☐ NO CRITICAL BUGS: 0 severity P1
☐ PERFORMANCE: Page load < 3 seconds
☐ SECURITY: PCI compliance OK
☐ EMAIL: All templates render correctly
☐ MOBILE: Responsive design OK
```

---

**Dokument do pełnego uzupełnienia w trakcie testowania automatycznego.**

Data rozpoczęcia: 2025-12-21 13:00  
Status: 🔴 W TRAKCIE TESTOWANIA  
Ostatnia aktualizacja: [będzie dodane]
