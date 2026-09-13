# Diagnostyka ścieżki klienta

## Zakres i stan

Zmiana rejestruje przyszłe kroki w `/konto` i wyniki wybranych operacji serwera. Nie odtwarza wcześniejszych kliknięć. Kod wymaga wdrożenia aplikacji; samo zapisanie gałęzi nie uruchamia logowania na produkcji. Nie wymaga migracji schematu bazy.

Historia: **Admin → Klienci → wybrany klient → Aktywność**, również `/admin/clients/<id>?tab=activity`. Widok pokazuje źródło, sekcję, czas, status HTTP, wizytę i numer kroku oraz korelację z odpowiedzią serwera. Czas jest wyświetlany w Europe/Warsaw. Historia jest stronicowana, a błąd jej pobrania nie jest przedstawiany jako brak aktywności. Jawne `client_id` ma pierwszeństwo nad starymi metadanymi e-mail.

## Co wiadomo, a czego nie

- `portal_opened`, `tab_opened`, `action_clicked`: obserwacje przeglądarki, nie dowody zrealizowanego zamówienia, zapisania pliku czy zapłaty.
- `module_load_started/succeeded/failed`, `retry_clicked`: stan ładowania widoczny w panelu. Pełny UUID z nagłówka `X-Correlation-ID` pozwala porównać obserwację z wynikiem serwera. Krótki kod sprawy z odpowiedzi nie zastępuje UUID.
- `request_succeeded/failed`: wynik serwera `/api/user/me`, `/api/user/action-summary`; błędy sprawdzenia sesji z `/api/user/session`.
- `voucher_pdf_generated/failed`: serwer wygenerował PDF vouchera **z oferty** lub generowanie nie powiodło się; powiązanie z konkretną ofertą. Wygenerowanie PDF nie dowodzi, że przeglądarka zapisała plik na dysku. Podgląd administratora nie jest przypisywany klientowi.
- Istniejące zdarzenia ofert, umów i zamówień CRM pozostają bez zmian. Nie dodano śledzenia każdej pozycji koszyka ani logiki realizacji nPhoto/Prodigi.

Utrata połączenia, zamknięcie karty i limity mogą spowodować brak zdarzeń przeglądarki. Kolejność przyjęcia równoległych żądań nie musi być kolejnością kliknięć — należy porównać wizytę i numer kroku. Zdarzenia przeglądarki mogą zostać powtórzone; nie stanowią księgi transakcji.

## Prywatność i niezawodność

- `POST /api/user/events` wymaga ważnej sesji aktywnego klienta oraz tego samego origin. Tożsamość wyznacza serwer, nie payload.
- Zamknięty schemat, maksymalnie 1024 bajty faktycznie odczytanego strumienia, limit 90 zdarzeń na minutę i klienta w istniejącym współdzielonym limiterze PostgreSQL. Wymaga istniejącego `ANALYTICS_RATE_LIMIT_SECRET` lub `JWT_SECRET` o długości minimum 32 znaków.
- Brak zapisu URL-i, parametrów zapytań, tokenów, IP, user agentów, treści dokumentów i notatek, danych zdjęć oraz naciskanych klawiszy w nowych zdarzeniach. ID konta pozostaje informacją powiązaną z klientem; historia jest dostępna wyłącznie administratorom.
- Nietrwałe ID wizyty tylko w pamięci, bez cookies analitycznych i localStorage. Reporter nie blokuje działania UI, ma timeout 2 s, maksymalnie 6 żądań równoległych i nie ponawia transportu automatycznie.
- Serwerowe wpisy diagnostyczne używają `after()` i nie zamieniają błędu logowania w błąd operacji klienta.
- Nowe wpisy mają `action=portal_event`. Godzinowa funkcja `cleanup-portal-diagnostics` usuwa tylko takie wpisy starsze niż 30 dni, najwyżej 10 000 na uruchomienie. Pełny batch wymaga sprawdzenia zaległości. Retencja zależy od wykonania zadania; należy sprawdzić logi funkcji po wdrożeniu. Nie usuwa historycznych logowań, zakupów, umów ani incydentów. Nie uruchomiono czyszczenia na produkcji podczas prac.
- Harmonogram uruchamia się na opublikowanym wdrożeniu, nie automatycznie na preview. [Dokumentacja Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/).

## Naprawy towarzyszące

- `/konto` nie oznacza modułu jako załadowanego przed zakończeniem żądania. Zmiana stanu nie anuluje już własnego pobierania. Powrót do sekcji i ponowienie po błędzie działają bez resetu strony.
- Zmiana konta resetuje cache i dane widoku; spóźnione żądania nie przywracają starego konta.
- Start `AuthContext` korzysta z lekkiego `/api/user/session`, nie z pobierającego dokumenty i vouchery `/api/user/me`. Błąd opcjonalnego modułu nie unieważnia sesji. Tylko 401/403 usuwa sesję; awaria/timeout pozwala wyświetlić błąd i ponowić bez odtwarzania prywatnych danych z localStorage.

## Voucher w ofercie a karta sklepowa

To odrębne ścieżki. Voucher rodzinny jest częścią `Offer.client_selection.familyVoucher`, a nie `gift_cards`. Widoczność wymaga uprawnienia do oferty, statusu widocznego dla klienta, kategorii rodzinnej i poprawnie odtworzonego pakietu. Ścieżka: **Dokumenty → oferta → Voucher dla rodziców do wydruku**. Nie należy przypisywać kart sklepowych w celu naprawy vouchera z oferty.

## Weryfikacja i wdrożenie

Uruchom:

```sh
node --import tsx --test tests/unit/client-portal-*.test.ts
npm run test:unit
npm run typecheck
git diff --check
```

Testy React renderują rzeczywiste komponenty w jsdom z kontrolowanymi granicami API/auth. Trzy powtórzenia dotyczą nawigacji, przerwania żądania, powrotu, błędu i ponowienia, zmiany konta i awarii telemetrii. Osobny test używa syntetycznej zaakceptowanej oferty rodzinnej z ukrytą ceną. Nie są to produkcyjne testy płatności, pełnych zamówień, rzeczywistej dostawy PDF ani wizualnej responsywności w przeglądarce.

Po wdrożeniu sprawdź na koncie testowym: logowanie, Dokumenty, ofertę rodzinną, pobranie PDF, korelację w Aktywności, odmowę dostępu z innego konta oraz działanie na telefonie. Następnie sprawdź pierwsze wykonanie retencji. Nie oznaczaj incydentu jako rozwiązany tylko dlatego, że dodano logowanie.

Wycofanie: przywrócenie poprzedniego wdrożenia kodu, bez cofania migracji bazy i bez kasowania zapisanej historii.
