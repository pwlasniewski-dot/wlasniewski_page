# Kalendarz administratora — weryfikacja 19.10.2026

Zmiana rozwija istniejący kalendarz i model Booking: formularz ręcznej rezerwacji na pulpicie i stronie kalendarza. Pulpit pokazuje miesiąc przed statystykami, z pobieraniem danych przy zmianie miesiąca lub zapisie. Rezerwacja ma jawnie podaną cenę, status `confirmed` i źródło `admin_calendar`; zapis nie wykonuje płatności, wysyłki wiadomości ani oznaczenia wpłaty. Wymagane są dane klienta, usługa, data i godziny tego samego dnia. Widoki zachowują status i kwotę zaliczki.

## Wyniki testów

- `node tests/qa/admin-calendar.cjs` — PASS. Rzeczywiste GET/POST ze stubami auth i przechowywania: odmowa dostępu przed zapisem; nieprawidłowa data, godziny, cena/typ, zbyt długi e-mail; zapis i ponowny odczyt; identyczne i kolidujące zgłoszenie zwraca 409; sąsiadujące godziny są dozwolone. Test kontroluje użycie blokady transakcyjnej zgodnej z checkout i brak oznaczenia wpłaty.
- `node --import tsx --test tests/unit/admin-calendar-ui.test.ts` — PASS. Rzeczywisty komponent React `AddCalendarBooking` renderowany w jsdom: otwarcie formularza, uzupełnienie danych, POST z tokenem i liczbową ceną, odpowiedź 201 zamyka formularz, pokazuje sukces i wywołuje odświeżenie. Odpowiedź 409 wyświetla komunikat, zachowuje dane i nie wywołuje odświeżenia. Zastąpiono granicę fetch; MessageChannel zapewnia adapter środowiska testowego React.

Testy nie zapisują danych produkcyjnych. Nie zastępują testu wdrożonego panelu z rzeczywistym administratorem i bazą. Walidacja TypeScript oraz niezależny odbiór całego zestawu zmian są raportowane oddzielnie.
