# Analityka wizyt i rezerwacji — 23.09.2026

## Problem i zakres

Historia sesji znajdowała się na końcu długiego raportu. Projekcja V3 ograniczała zdarzenia do czasu, rodzaju i strony, pomijała wybory oraz błędy formularza. Część przycisków zapisywała jedynie `button:button`. Lista sesji sortowała po początku wizyty, a ścieżka zachowywała pierwsze 80 kroków, ukrywając nowsze w długich wizytach.

## Zmiana

- Domyślna zakładka wizyt i rezerwacji; osobne zakładki sprzedaży i Google/SEO.
- Czytelne karty i oś czasu na telefonie, widoczny czas ostatniego zapisu, filtry i stany danych.
- Semantyczne akcje rezerwacji; nazwa wybranej usługi/pakietu, data/godzina, stan pól, błędy dostępności, walidacji i płatności.
- Wspólna allowlista dla przeglądarki, ingest i prezentacji. Brak prywatnych treści pól, haseł i wartości kodów.
- Zapisane rezerwacje powiązane przez istniejący `analytics_session_id`; brak dopasowywania tożsamości na podstawie domysłów.
- Sortowanie wizyt według ostatniego odbioru przez serwer, najnowsze 120 istotnych kroków i jawna liczba pominiętych. Chronologia działań używa czasu przeglądarki tylko do 5 minut od odbioru; błędny lub rozjechany zegar zastępuje czas serwera. Opóźnione żądanie otwarcia strony nie czyści później wpisanych stanów pól.
- Programowe wyczyszczenie pól i autofill przy wysłaniu aktualizują stan bez zapisywania treści. Wybór pakietu promocyjnego zalicza istniejący etap pakietu w lejku.
- Awaria źródła zdarzeń pojawia się nad listą wizyt i nie jest przedstawiana jako brak ruchu.

## Ograniczenia

Nowy pomiar działa po publikacji i wyłącznie przy dotychczasowej zgodzie analitycznej. Brak zdarzenia nie potwierdza porzucenia, pustego pola ani braku problemu. Ostatnia aktywność nie jest potwierdzeniem obecności online. Stare kliknięcia bez semantyki pozostają oznaczone jako nieopisane; zapisanych stanów pól nie można traktować jako kopii rezerwacji. Nie zmieniamy cen, warunków rezerwacji, PayU ani danych klientów. Brak migracji i płatnej dodatkowej usługi.

## Weryfikacja

- 59 testów kontraktu, ingest, rzeczywistego formularza i trackera, projekcji, lejka, atrybucji i walidacji: PASS.
- 10 grup interakcji React DOM panelu: PASS (zakładki, klawiatura, filtry, szczegóły, błędy, odświeżenie, zmiana zakresu, brak dostępu, integracja z rzeczywistą projekcją).
- Niezależny odbiór QA: PASS, wszystkie zgłoszone problemy poprawione i sprawdzone regresjami.
- `npm run build`: exit 0; bramki SEO, zdarzeń panelu i sklepu zaliczone, artefakty Next wygenerowane. W tym środowisku Node 24; docelowy projekt wskazuje Node 22.
- Globalny `npm run typecheck`: nie jest czysty (104 diagnostyki, 106 na bazie). Brak nowych par plik/kod błędu i brak błędów w zmienionych plikach; istniejące błędy m.in. PDF, bloga i sklepu. Istniejąca konfiguracja Next pomija błędy typów podczas builda.
- `git diff --check`: PASS.
- Ogląd mobilnego renderu pozostaje do sprawdzenia na podglądzie HTTPS. Przeglądarka odrzuciła lokalny plik kontrolny ze względu na niedozwolony protokół; nie obchodzono blokady. Testy DOM nie zastępują odbioru wizualnego.
- Publikacja produkcyjna niepotwierdzona. Brak zapisów do produkcyjnej bazy podczas prac.
